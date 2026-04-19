'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { calcularMonto } from '@/lib/logic/precios';

export type ProfesorData = { id: string; nombre: string; apellido: string };

// ─── Zod schemas (validan el boundary cliente→servidor) ────────────────────

const zUUID = z.string().min(1);

const UpdateGrupoSchema = z
  .object({
    id: zUUID,
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
    cupo: z.number().int().min(1).max(200),
    edadMin: z.number().int().min(0).max(99),
    edadMax: z.number().int().min(1).max(100),
    tier: z.enum(['BASE', 'T1', 'T2', 'T3', 'T4', 'FULL']),
    idGrupoSiguiente: z.string().nullable(),
    activo: z.boolean(),
    descripcion: z.string().max(500).nullable(),
    profesorId: z.string().nullable(),
  })
  .refine((d) => d.edadMin < d.edadMax, {
    message: 'La edad mínima debe ser menor a la máxima.',
    path: ['edadMax'],
  });

const DisciplinaRowSchema = z.object({
  disciplinaId: zUUID,
  dias: z.array(z.enum(['L', 'M', 'X', 'J', 'V', 'S', 'D'])).min(1),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  duracionMinutos: z.number().int().positive(),
});

const CrearGrupoSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
    categoria: z.enum(['EPIC_TOTZ', 'HAPPY_FEET', 'EPIC_ONE', 'TEEN', 'COMPETICION']),
    edadMin: z.number().int().min(0).max(99),
    edadMax: z.number().int().min(1).max(100),
    cupo: z.number().int().min(1).max(200),
    disciplinas: z.array(DisciplinaRowSchema),
    precioMensualidad: z.number().min(0),
    activo: z.boolean(),
    profesorId: z.string().nullable().optional(),
    descripcion: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.edadMin < d.edadMax, {
    message: 'La edad mínima debe ser menor a la máxima.',
    path: ['edadMax'],
  });

// Calcula la edad al 1° de agosto del ciclo activo (misma lógica que el wizard)
function calcularEdadCiclo(fechaNacimiento: Date): number {
  const ahora = new Date();
  const yearRef = ahora.getMonth() >= 7 ? ahora.getFullYear() : ahora.getFullYear() - 1;
  const agosto = new Date(yearRef, 7, 1);
  let edad = agosto.getFullYear() - fechaNacimiento.getFullYear();
  const dm = agosto.getMonth() - fechaNacimiento.getMonth();
  if (dm < 0 || (dm === 0 && agosto.getDate() < fechaNacimiento.getDate())) edad--;
  return edad;
}

// ─────────────────────────────────────────────
// 0. Listar profesores activos
// ─────────────────────────────────────────────

export async function getProfesoresActivos(): Promise<{ id: string; nombre: string; apellido: string }[]> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) =>
      tx.usuario.findMany({
        where: { rol: 'MAESTRO', activo: true },
        select: { id: true, nombre: true, apellido: true },
        orderBy: [{ nombre: 'asc' }],
      }),
    );
  } catch (err) {
    console.error('[getProfesoresActivos]', err);
    return [];
  }
}

// ─────────────────────────────────────────────
// 1. Actualizar configuración de un grupo
// ─────────────────────────────────────────────

interface UpdateGrupoInput {
  id: string;
  nombre: string;
  cupo: number;
  edadMin: number;
  edadMax: number;
  tier: string;
  idGrupoSiguiente: string | null;
  activo: boolean;
  descripcion: string | null;
  profesorId: string | null;
}

export async function updateGrupoConfig(input: UpdateGrupoInput) {
  const parsed = UpdateGrupoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const session = await getServerSession(authOptions);

  try {
    await withRLS(session, (tx) =>
      tx.grupo.update({
        where: { id: input.id },
        data: {
          nombre: input.nombre,
          cupo: input.cupo,
          edadMin: input.edadMin,
          edadMax: input.edadMax,
          tier: input.tier as import('@/app/generated/prisma/client').TipoTierGrupo,
          idGrupoSiguiente: input.idGrupoSiguiente,
          activo: input.activo,
          descripcion: input.descripcion,
          profesorId: input.profesorId,
        },
      }),
    );
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[updateGrupoConfig]', err);
    return { ok: false, error: 'No se pudo guardar el grupo.' };
  }
}

// ─────────────────────────────────────────────
// 2. Toggle estrella de competencia
// ─────────────────────────────────────────────

export async function toggleInvitacionCompetencia(alumnaId: string) {
  if (!zUUID.safeParse(alumnaId).success) {
    return { ok: false, error: 'ID de alumna inválido.' };
  }

  const session = await getServerSession(authOptions);

  try {
    const alumna = await withRLS(session, (tx) =>
      tx.alumna.findUnique({
        where: { id: alumnaId },
        select: { invitadaCompetencia: true },
      }),
    );

    if (!alumna) return { ok: false, error: 'Alumna no encontrada.' };

    await withRLS(session, (tx) =>
      tx.alumna.update({
        where: { id: alumnaId },
        data: { invitadaCompetencia: !alumna.invitadaCompetencia },
      }),
    );

    revalidatePath('/admin/configuracion');
    return { ok: true, nuevoValor: !alumna.invitadaCompetencia };
  } catch (err) {
    console.error('[toggleInvitacionCompetencia]', err);
    return { ok: false, error: 'Error al actualizar la estrella.' };
  }
}

// ─────────────────────────────────────────────
// 3. Reasignar alumna a otro grupo
// ─────────────────────────────────────────────

export type ReasignacionResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; error: 'FUERA_DE_RANGO'; edadAlumna: number; edadMin: number; edadMax: number };

export async function reasignarAlumna(
  alumnaId: string,
  grupoDestinoId: string,
  forzar = false,
): Promise<ReasignacionResult> {
  const ids = z.object({ alumnaId: zUUID, grupoDestinoId: zUUID }).safeParse({ alumnaId, grupoDestinoId });
  if (!ids.success) return { ok: false, error: 'IDs inválidos.' };

  const session = await getServerSession(authOptions);

  try {
    const [alumna, grupoDestino] = await withRLS(session, (tx) =>
      Promise.all([
        tx.alumna.findUnique({ where: { id: alumnaId }, select: { fechaNacimiento: true } }),
        tx.grupo.findUnique({
          where: { id: grupoDestinoId },
          select: { cupo: true, edadMin: true, edadMax: true },
        }),
      ]),
    );

    if (!alumna || !grupoDestino) {
      return { ok: false, error: 'Alumna o grupo no encontrado.' };
    }

    // Contar alumnas únicas inscritas en el grupo destino
    const inscritasDestino = await withRLS(session, (tx) =>
      tx.alumnaClase.findMany({
        where: { grupoId: grupoDestinoId },
        select: { alumnaId: true },
        distinct: ['alumnaId'],
      }),
    );

    if (inscritasDestino.length >= grupoDestino.cupo) {
      return { ok: false, error: `El grupo destino no tiene lugares disponibles (${grupoDestino.cupo}/${grupoDestino.cupo}).` };
    }

    // Verificar rango de edad (omitir si el admin forzó la asignación)
    if (!forzar) {
      const edadAlumna = calcularEdadCiclo(alumna.fechaNacimiento);
      if (edadAlumna < grupoDestino.edadMin || edadAlumna > grupoDestino.edadMax) {
        return {
          ok: false,
          error: 'FUERA_DE_RANGO',
          edadAlumna,
          edadMin: grupoDestino.edadMin,
          edadMax: grupoDestino.edadMax,
        };
      }
    }

    // Reasignar todos los registros AlumnaClase de esta alumna al nuevo grupo
    await withRLS(session, (tx) =>
      tx.alumnaClase.updateMany({
        where: { alumnaId },
        data: { grupoId: grupoDestinoId },
      }),
    );

    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[reasignarAlumna]', err);
    return { ok: false, error: 'Error interno al reasignar.' };
  }
}

// ─────────────────────────────────────────────
// 4. Leer disciplinas de una alumna en un grupo
// ─────────────────────────────────────────────

export async function getAlumnaDisciplinasEnGrupo(
  alumnaId: string,
  grupoId: string,
): Promise<string[]> {
  const session = await getServerSession(authOptions);

  try {
    const records = await withRLS(session, (tx) =>
      tx.alumnaDisciplina.findMany({
        where: { alumnaId, grupoId },
        select: { disciplinaId: true },
      }),
    );
    return records.map((r) => r.disciplinaId);
  } catch (err) {
    console.error('[getAlumnaDisciplinasEnGrupo]', err);
    return [];
  }
}

// ─────────────────────────────────────────────
// 5. Guardar disciplinas de una alumna en un grupo + actualiza cargo mensual
// ─────────────────────────────────────────────

export async function setAlumnaDisciplinasEnGrupo(
  alumnaId: string,
  grupoId: string,
  disciplinaIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const v = z
    .object({ alumnaId: zUUID, grupoId: zUUID, disciplinaIds: z.array(zUUID) })
    .safeParse({ alumnaId, grupoId, disciplinaIds });
  if (!v.success) return { ok: false, error: 'Datos inválidos.' };

  const session = await getServerSession(authOptions);

  try {
    await withRLS(session, async (tx) => {
      // Reemplazar todas las disciplinas asignadas a esta alumna en el grupo
      await tx.alumnaDisciplina.deleteMany({ where: { alumnaId, grupoId } });

      if (disciplinaIds.length > 0) {
        await tx.alumnaDisciplina.createMany({
          data: disciplinaIds.map((disciplinaId) => ({ alumnaId, grupoId, disciplinaId })),
        });
      }

      // Calcular el monto proporcional desde BD (fuente de verdad: tarifa + total disciplinas del grupo)
      const [tarifa, totalDiscs] = await Promise.all([
        tx.tarifaMensualidad.findUnique({ where: { grupoId } }),
        tx.grupoDisciplina.count({ where: { grupoId } }),
      ]);
      const montoNuevo = calcularMonto(
        tarifa?.precioMensualidad.toNumber() ?? 0,
        totalDiscs,
        disciplinaIds.length,
      );

      // Actualizar el cargo mensual pendiente más reciente
      const cargo = await tx.cargo.findFirst({
        where: {
          alumnaId,
          estado: { in: ['PENDIENTE', 'VENCIDO'] },
          concepto: { tipo: 'MENSUALIDAD' },
        },
        orderBy: { fechaVencimiento: 'desc' },
      });

      if (cargo) {
        await tx.cargo.update({
          where: { id: cargo.id },
          data: {
            montoFinal: montoNuevo,
            motivoDescuento:
              montoNuevo < cargo.montoOriginal.toNumber()
                ? `Ajuste por disciplinas seleccionadas (${disciplinaIds.length})`
                : null,
          },
        });
      }
    });

    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[setAlumnaDisciplinasEnGrupo]', err);
    return { ok: false, error: 'Error al guardar las disciplinas.' };
  }
}

// ─────────────────────────────────────────────
// 7. Remover alumna de su grupo actual
// ─────────────────────────────────────────────

export async function removerAlumnaDeGrupo(alumnaId: string) {
  const session = await getServerSession(authOptions);

  try {
    await withRLS(session, (tx) =>
      tx.alumnaClase.updateMany({
        where: { alumnaId },
        data: { grupoId: null },
      }),
    );
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[removerAlumnaDeGrupo]', err);
    return { ok: false, error: 'Error al remover alumna del grupo.' };
  }
}

// ─────────────────────────────────────────────
// 8. Remover una disciplina de un grupo
// ─────────────────────────────────────────────

export async function removerDisciplinaDeGrupo(grupoId: string, disciplinaId: string) {
  const session = await getServerSession(authOptions);

  try {
    await withRLS(session, (tx) =>
      tx.grupoDisciplina.delete({
        where: { grupoId_disciplinaId: { grupoId, disciplinaId } },
      }),
    );
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[removerDisciplinaDeGrupo]', err);
    return { ok: false, error: 'Error al remover la disciplina.' };
  }
}

// ─────────────────────────────────────────────
// 9a. Tarifa por categoría y tier exacto
// ─────────────────────────────────────────────

export async function getTarifaPorTier(
  categoria: string,
  tier: string,
): Promise<{ precioMensualidad: number } | null> {
  const session = await getServerSession(authOptions);

  try {
    const grupo = await withRLS(session, (tx) =>
      tx.grupo.findFirst({
        where: {
          categoria: categoria as import('@/app/generated/prisma/client').CategoriaGrupo,
          tier: tier as import('@/app/generated/prisma/client').TipoTierGrupo,
          activo: true,
          tarifa: { isNot: null },
        },
        select: { tarifa: { select: { precioMensualidad: true } } },
      }),
    );

    if (grupo?.tarifa) {
      return { precioMensualidad: grupo.tarifa.precioMensualidad.toNumber() };
    }
    return null;
  } catch (err) {
    console.error('[getTarifaPorTier]', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 9. Tarifa de referencia por categoría
// ─────────────────────────────────────────────

export async function getTarifaReferencia(
  categoria: string,
): Promise<{ precioMensualidad: number; precioPreseason: number | null } | null> {
  const session = await getServerSession(authOptions);

  try {
    // Busca primero el grupo FULL de la categoría; si no existe, toma cualquiera con tarifa
    const grupo = await withRLS(session, (tx) =>
      tx.grupo.findFirst({
        where: {
          categoria: categoria as import('@/app/generated/prisma/client').CategoriaGrupo,
          tier: 'FULL',
          activo: true,
          tarifa: { isNot: null },
        },
        select: { tarifa: { select: { precioMensualidad: true, precioPreseason: true } } },
      }),
    );

    if (grupo?.tarifa) {
      return {
        precioMensualidad: grupo.tarifa.precioMensualidad.toNumber(),
        precioPreseason: grupo.tarifa.precioPreseason?.toNumber() ?? null,
      };
    }

    // Fallback: cualquier grupo de la categoría con tarifa
    const fallback = await withRLS(session, (tx) =>
      tx.grupo.findFirst({
        where: {
          categoria: categoria as import('@/app/generated/prisma/client').CategoriaGrupo,
          activo: true,
          tarifa: { isNot: null },
        },
        select: { tarifa: { select: { precioMensualidad: true, precioPreseason: true } } },
      }),
    );

    if (fallback?.tarifa) {
      return {
        precioMensualidad: fallback.tarifa.precioMensualidad.toNumber(),
        precioPreseason: fallback.tarifa.precioPreseason?.toNumber() ?? null,
      };
    }

    return null;
  } catch (err) {
    console.error('[getTarifaReferencia]', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 10. Disciplinas completas de un grupo (para clonar)
// ─────────────────────────────────────────────

export async function getGrupoDisciplinasCompletas(grupoId: string): Promise<
  { disciplinaId: string; dias: string[]; horaInicio: string; duracionMinutos: number; horaTexto: string }[]
> {
  const session = await getServerSession(authOptions);

  try {
    const records = await withRLS(session, (tx) =>
      tx.grupoDisciplina.findMany({
        where: { grupoId },
        select: {
          disciplinaId: true,
          dias: true,
          horaInicio: true,
          duracionMinutos: true,
          horaTexto: true,
        },
      }),
    );
    return records;
  } catch (err) {
    console.error('[getGrupoDisciplinasCompletas]', err);
    return [];
  }
}

// ─────────────────────────────────────────────
// 11. Crear nuevo grupo
// ─────────────────────────────────────────────

// Sólo datos crudos del cliente — toda lógica de negocio se resuelve aquí
interface DisciplinaRowInput {
  disciplinaId: string;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
}

interface CrearGrupoInput {
  nombre: string;
  categoria: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  disciplinas: DisciplinaRowInput[];
  precioMensualidad: number;
  activo: boolean;
  profesorId?: string | null;
  descripcion?: string | null;
}

export interface ResumenGrupoCreado {
  nombre: string;
  tier: string;
  numDisciplinas: number;
  precioMensualidad: number;
  activo: boolean;
}

// Tier derivado del número de disciplinas (regla de negocio)
function derivarTier(numDisciplinas: number): import('@/app/generated/prisma/client').TipoTierGrupo {
  if (numDisciplinas <= 0) return 'BASE';
  if (numDisciplinas === 1) return 'T1';
  if (numDisciplinas === 2) return 'T2';
  if (numDisciplinas === 3) return 'T3';
  if (numDisciplinas === 4) return 'T4';
  return 'FULL';
}

// Texto de horario legible almacenado en BD para evitar recalcularlo en lecturas
function buildHoraTexto(dias: string[], horaInicio: string, duracionMinutos: number): string {
  if (!dias.length || !horaInicio) return '';
  const DIA_LARGO: Record<string, string> = {
    L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom',
  };
  const [h, m] = horaInicio.split(':').map(Number);
  const finTotal = h * 60 + m + duracionMinutos;
  const horaFin = `${String(Math.floor(finTotal / 60)).padStart(2, '0')}:${String(finTotal % 60).padStart(2, '0')}`;
  const labels = dias.map((d) => DIA_LARGO[d]).filter(Boolean);
  const diaStr =
    labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} y ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`;
  return `${diaStr} ${horaInicio}–${horaFin}`;
}

export async function crearGrupo(
  input: CrearGrupoInput,
): Promise<{ ok: true; id: string; resumen: ResumenGrupoCreado } | { ok: false; error: string }> {
  const parsed = CrearGrupoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const session = await getServerSession(authOptions);

  try {
    // Lógica de negocio — el cliente sólo manda datos crudos
    const tier = derivarTier(input.disciplinas.length);
    const esCompetitivo = input.categoria === 'COMPETICION';
    const primera = input.disciplinas[0];
    const horasPorSemana = input.disciplinas.reduce(
      (sum, d) => sum + (d.duracionMinutos / 60) * d.dias.length,
      0,
    );

    const grupoId = await withRLS(session, async (tx) => {
      const g = await tx.grupo.create({
        data: {
          nombre: input.nombre,
          categoria: input.categoria as import('@/app/generated/prisma/client').CategoriaGrupo,
          esCompetitivo,
          tier,
          edadMin: input.edadMin,
          edadMax: input.edadMax,
          horasPorSemana,
          dias: primera?.dias ?? [],
          horaInicio: primera?.horaInicio ?? '08:00',
          duracionMinutos: primera?.duracionMinutos ?? 60,
          cupo: input.cupo,
          activo: input.activo,
          descripcion: input.descripcion ?? null,
          profesorId: input.profesorId ?? null,
        },
      });

      if (input.disciplinas.length > 0) {
        await tx.grupoDisciplina.createMany({
          data: input.disciplinas.map((d) => ({
            grupoId: g.id,
            disciplinaId: d.disciplinaId,
            dias: d.dias,
            horaInicio: d.horaInicio,
            duracionMinutos: d.duracionMinutos,
            horaTexto: buildHoraTexto(d.dias, d.horaInicio, d.duracionMinutos),
          })),
        });
      }

      // precioPreseason se toma de Configuracion; si no existe se omite (campo nullable en DB)
      const configPreseason = await tx.configuracion.findUnique({
        where: { clave: 'precio_preseason_default' },
        select: { valor: true },
      });
      const precioPreseason = configPreseason ? Number(configPreseason.valor) : null;

      await tx.tarifaMensualidad.create({
        data: {
          grupoId: g.id,
          precioMensualidad: input.precioMensualidad,
          ...(precioPreseason !== null && { precioPreseason }),
          horasPorSemana,
          activo: true,
        },
      });

      return g.id;
    });

    revalidatePath('/admin/configuracion');
    return {
      ok: true,
      id: grupoId,
      resumen: {
        nombre: input.nombre,
        tier,
        numDisciplinas: input.disciplinas.length,
        precioMensualidad: input.precioMensualidad,
        activo: input.activo,
      },
    };
  } catch (err) {
    console.error('[crearGrupo]', err);
    return { ok: false, error: 'Error al crear el grupo.' };
  }
}

// ─────────────────────────────────────────────
// 12. Clonar grupo existente (copia directa sin edición)
// ─────────────────────────────────────────────

export async function clonarGrupo(
  origenId: string,
  nuevoNombre: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);

  try {
    const origen = await withRLS(session, (tx) =>
      tx.grupo.findUnique({
        where: { id: origenId },
        include: { disciplinasGrupo: true, tarifa: true },
      }),
    );

    if (!origen) return { ok: false, error: 'Grupo origen no encontrado.' };

    const grupoId = await withRLS(session, async (tx) => {
      const g = await tx.grupo.create({
        data: {
          nombre: nuevoNombre,
          categoria: origen.categoria,
          esCompetitivo: origen.esCompetitivo,
          tier: origen.tier,
          edadMin: origen.edadMin,
          edadMax: origen.edadMax,
          horasPorSemana: origen.horasPorSemana,
          dias: origen.dias,
          horaInicio: origen.horaInicio,
          duracionMinutos: origen.duracionMinutos,
          cupo: origen.cupo,
          activo: true,
        },
      });

      if (origen.disciplinasGrupo.length > 0) {
        await tx.grupoDisciplina.createMany({
          data: origen.disciplinasGrupo.map((gd) => ({
            grupoId: g.id,
            disciplinaId: gd.disciplinaId,
            dias: gd.dias,
            horaInicio: gd.horaInicio,
            duracionMinutos: gd.duracionMinutos,
            horaTexto: gd.horaTexto,
          })),
        });
      }

      if (origen.tarifa) {
        await tx.tarifaMensualidad.create({
          data: {
            grupoId: g.id,
            precioMensualidad: origen.tarifa.precioMensualidad,
            precioPreseason: origen.tarifa.precioPreseason,
            horasPorSemana: origen.tarifa.horasPorSemana,
            activo: true,
          },
        });
      }

      return g.id;
    });

    revalidatePath('/admin/configuracion');
    return { ok: true, id: grupoId };
  } catch (err) {
    console.error('[clonarGrupo]', err);
    return { ok: false, error: 'Error al clonar el grupo.' };
  }
}
