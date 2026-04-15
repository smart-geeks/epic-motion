/**
 * prisma-rls.ts
 *
 * Helper para ejecutar queries de Prisma dentro de una transacción
 * que inyecta las variables de sesión que requieren las políticas RLS:
 *   - app.current_user_id  → ID del usuario autenticado (NextAuth session)
 *   - app.current_user_rol → Rol del usuario (ADMIN, MAESTRO, PADRE, etc.)
 *
 * Por qué es necesario:
 *   Supabase RLS usa auth.uid() de Supabase Auth. Este proyecto usa NextAuth,
 *   por lo que las políticas en rls.sql usan current_setting() en su lugar.
 *   SET LOCAL solo persiste dentro de una transacción, lo cual es exactamente
 *   lo que queremos: las variables se limpian al terminar cada operación.
 *
 * Uso:
 *   import { withRLS } from "@/lib/prisma-rls";
 *   import { getServerSession } from "next-auth";
 *   import { authOptions } from "@/lib/auth";
 *
 *   const session = await getServerSession(authOptions);
 *   const resultado = await withRLS(session, (tx) =>
 *     tx.alumna.findMany()
 *   );
 */

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

// Tipo que expone el cliente transaccional de Prisma
type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Ejecuta `fn` dentro de una transacción de Prisma con las variables
 * de sesión RLS configuradas para el usuario autenticado.
 *
 * Si no hay sesión activa se lanza un error — nunca ejecutar con
 * variables vacías, ya que las políticas RLS denegarían todo acceso
 * (comportamiento correcto: fail closed, no fail open).
 */
export async function withRLS<T>(
  session: Session | null,
  fn: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  if (!session?.user?.id || !session?.user?.rol) {
    throw new Error("withRLS: sesión inválida o sin rol definido");
  }

  const userId = session.user.id;
  const userRol = session.user.rol;

  return prisma.$transaction(async (tx) => {
    // SET LOCAL → las variables solo existen durante esta transacción.
    // Usar set_config en lugar de SET LOCAL para compatibilidad con pgBouncer.
    await tx.$executeRaw`
      SELECT set_config('app.current_user_id',  ${userId},  true),
             set_config('app.current_user_rol',  ${userRol}, true)
    `;

    return fn(tx);
  });
}

/**
 * Versión para operaciones de Admin que no requieren contexto de usuario
 * específico (ej. tareas de sistema, seeds, jobs nocturnos).
 * Inyecta rol ADMIN para que las políticas permitan acceso total.
 */
export async function withAdminRLS<T>(
  adminUserId: string,
  fn: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_user_id',  ${adminUserId}, true),
             set_config('app.current_user_rol',  ${"ADMIN"},     true)
    `;

    return fn(tx);
  });
}
