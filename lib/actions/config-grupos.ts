'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

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
}

export async function updateGrupoConfig(input: UpdateGrupoInput) {
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
        },
      }),
    );
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
  montoNuevo: number,
): Promise<{ ok: boolean; error?: string }> {
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
    return { ok: true };
  } catch (err) {
    console.error('[removerDisciplinaDeGrupo]', err);
    return { ok: false, error: 'Error al remover la disciplina.' };
  }
}

// ─────────────────────────────────────────────
// 9. Tarifa de referencia por categoría
// ─────────────────────────────────────────────

export async function getTarifaReferencia(
  categoria: string,
): Promise<{ precioMensualidad: number; precioPreseason: number } | null> {
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
        precioPreseason: grupo.tarifa.precioPreseason.toNumber(),
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
        precioPreseason: fallback.tarifa.precioPreseason.toNumber(),
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

interface DisciplinaRowInput {
  disciplinaId: string;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
  horaTexto: string;
}

interface CrearGrupoInput {
  nombre: string;
  categoria: string;
  esCompetitivo: boolean;
  tier: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  disciplinas: DisciplinaRowInput[];
  precioMensualidad: number;
  precioPreseason: number;
}

export async function crearGrupo(
  input: CrearGrupoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);

  try {
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
          esCompetitivo: input.esCompetitivo,
          tier: input.tier as import('@/app/generated/prisma/client').TipoTierGrupo,
          edadMin: input.edadMin,
          edadMax: input.edadMax,
          horasPorSemana,
          dias: primera?.dias ?? [],
          horaInicio: primera?.horaInicio ?? '08:00',
          duracionMinutos: primera?.duracionMinutos ?? 60,
          cupo: input.cupo,
          activo: true,
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
            horaTexto: d.horaTexto,
          })),
        });
      }

      await tx.tarifaMensualidad.create({
        data: {
          grupoId: g.id,
          precioMensualidad: input.precioMensualidad,
          precioPreseason: input.precioPreseason,
          horasPorSemana,
          activo: true,
        },
      });

      return g.id;
    });

    revalidatePath('/admin/configuracion');
    return { ok: true, id: grupoId };
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
