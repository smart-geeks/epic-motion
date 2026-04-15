"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { EstadoPago, TipoPago } from "@/app/generated/prisma/client";

// ─────────────────────────────────────────────
// Schema de validación (Zod)
// ─────────────────────────────────────────────

const InscripcionSchema = z.object({
  // Si se pasa alumnaId, se actualiza la alumna existente; de lo contrario se crea una nueva.
  alumnaId: z.cuid().optional(),

  // Datos personales de la alumna
  nombre: z.string().min(1, "El nombre es obligatorio").max(80),
  apellido: z.string().min(1, "El apellido es obligatorio").max(80),
  fechaNacimiento: z.coerce.date({ message: "La fecha de nacimiento es obligatoria" }),
  foto: z.url().optional(),
  estatus: z.enum(["ACTIVA", "INACTIVA", "PRUEBA"] as const).default("ACTIVA"),

  // Vínculo con el padre (usuario con rol PADRE)
  padreId: z.cuid({ message: "padreId inválido" }),

  // Clases en las que se inscribe (al menos una)
  claseIds: z
    .array(z.cuid())
    .min(1, "Debe seleccionarse al menos una clase"),

  // Paquete que determina el importe del primer pago
  paqueteId: z.cuid({ message: "paqueteId inválido" }),

  // Fecha límite del primer pago
  fechaVencimiento: z.coerce.date({ message: "La fecha de vencimiento es obligatoria" }),

  // Descripción del cargo (ej. "Inscripción julio 2026")
  concepto: z.string().max(200).default("Mensualidad de inscripción"),
});

export type InscripcionInput = z.infer<typeof InscripcionSchema>;

// ─────────────────────────────────────────────
// Tipos de respuesta
// ─────────────────────────────────────────────

export type InscripcionResult =
  | { ok: true; alumnaId: string; pagoId: string }
  | { ok: false; error: string; campos?: Record<string, string[]> };

// ─────────────────────────────────────────────
// Server Action principal
// ─────────────────────────────────────────────

export async function inscribirAlumna(
  raw: unknown
): Promise<InscripcionResult> {
  // 1. Validar input con Zod
  const parsed = InscripcionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos de inscripción inválidos",
      campos: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const input = parsed.data;

  // 2. Ejecutar en una sola transacción interactiva
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // ── A. Verificar que el padre existe y tiene el rol correcto ──
      const padre = await tx.usuario.findUnique({
        where: { id: input.padreId },
        select: { id: true, rol: true, activo: true },
      });

      if (!padre || !padre.activo) {
        throw new InscripcionError("El padre no existe o su cuenta está inactiva");
      }
      if (padre.rol !== "PADRE") {
        throw new InscripcionError("El usuario indicado no tiene el rol de PADRE");
      }

      // ── B. Obtener paquete y verificar que existe y está activo ──
      const paquete = await tx.paquete.findUnique({
        where: { id: input.paqueteId },
        select: { id: true, nombre: true, precio: true, activo: true },
      });

      if (!paquete || !paquete.activo) {
        throw new InscripcionError("El paquete seleccionado no existe o está inactivo");
      }

      // ── C. Verificar cupo en cada clase antes de inscribir ──
      const clasesConCupo = await tx.clase.findMany({
        where: { id: { in: input.claseIds } },
        select: {
          id: true,
          nombre: true,
          cupo: true,
          _count: { select: { alumnas: true } },
        },
      });

      // Validar que se encontraron todas las clases solicitadas
      if (clasesConCupo.length !== input.claseIds.length) {
        const encontrados = new Set(clasesConCupo.map((c) => c.id));
        const faltantes = input.claseIds.filter((id) => !encontrados.has(id));
        throw new InscripcionError(
          `Las siguientes clases no existen: ${faltantes.join(", ")}`
        );
      }

      // Validar cupo disponible en cada clase
      const clasesSinCupo = clasesConCupo.filter(
        (c) => c._count.alumnas >= c.cupo
      );
      if (clasesSinCupo.length > 0) {
        const nombres = clasesSinCupo.map((c) => c.nombre).join(", ");
        throw new InscripcionError(
          `Sin cupo disponible en: ${nombres}`
        );
      }

      // ── D. Crear o actualizar la Alumna ──
      let alumna: { id: string };

      if (input.alumnaId) {
        // Actualizar alumna existente
        alumna = await tx.alumna.update({
          where: { id: input.alumnaId },
          data: {
            nombre: input.nombre,
            apellido: input.apellido,
            fechaNacimiento: input.fechaNacimiento,
            foto: input.foto,
            estatus: input.estatus,
          },
          select: { id: true },
        });
      } else {
        // Crear nueva alumna
        alumna = await tx.alumna.create({
          data: {
            nombre: input.nombre,
            apellido: input.apellido,
            fechaNacimiento: input.fechaNacimiento,
            foto: input.foto,
            estatus: input.estatus,
            padreId: input.padreId,
          },
          select: { id: true },
        });
      }

      // ── E. Vincular a clases (skipDuplicates respeta el @@unique) ──
      await tx.alumnaClase.createMany({
        data: input.claseIds.map((claseId) => ({
          alumnaId: alumna.id,
          claseId,
        })),
        skipDuplicates: true, // No falla si ya estaba inscrita en alguna clase
      });

      // ── F. Generar el primer pago (mensualidad de inscripción) ──
      const pago = await tx.pago.create({
        data: {
          importe: paquete.precio,
          concepto: input.concepto || `Inscripción — ${paquete.nombre}`,
          fechaVencimiento: input.fechaVencimiento,
          estado: EstadoPago.PENDIENTE,
          tipo: TipoPago.INSCRIPCION,
          alumnaId: alumna.id,
          padreId: input.padreId,
        },
        select: { id: true },
      });

      return { alumnaId: alumna.id, pagoId: pago.id };
    });

    // 3. Invalidar caché de las páginas afectadas
    revalidatePath("/admin/inscripciones");
    revalidatePath("/admin/alumnas");

    return { ok: true, ...resultado };
  } catch (err) {
    if (err instanceof InscripcionError) {
      return { ok: false, error: err.message };
    }
    // Error inesperado — no exponer detalles al cliente
    console.error("[inscribirAlumna]", err);
    return { ok: false, error: "Error interno al procesar la inscripción" };
  }
}

// ─────────────────────────────────────────────
// Error tipado para errores de negocio esperados
// ─────────────────────────────────────────────

class InscripcionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InscripcionError";
  }
}
