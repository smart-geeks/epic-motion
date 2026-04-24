'use server';

// Capa de acciones — valida sesión, valida input con Zod,
// delega la lógica al service layer dentro de withRLS y revalida la ruta.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import * as svc from '@/lib/services/configuracion-service';
import { buildHoraTexto } from '@/lib/services/common-service';
import type {
  ReasignacionResult,
  ResumenGrupoCreado,
  UpdateGrupoInput,
  CrearGrupoInput,
  UpdateCursoEspecialInput,
  DatosClonacion,
} from '@/types/configuracion';

// ─── Zod schemas (boundary cliente → servidor) ─────────────────────────────

const zUUID = z.string().min(1);

const DIAS_VALIDOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

// Esquema base con campos comunes a creación y edición
const GrupoBaseSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
    cupo: z.number().int().min(1).max(200),
    edadMin: z.number().int().min(0).max(99),
    edadMax: z.number().int().min(1).max(100),
    activo: z.boolean(),
    profesorId: z.string().nullable().optional(),
    salonId: z.string().nullable().optional(),
    descripcion: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.edadMin < d.edadMax, {
    message: 'La edad mínima debe ser menor a la máxima.',
    path: ['edadMax'],
  });

const UpdateGrupoSchema = GrupoBaseSchema.extend({
  id: zUUID,
  tier: z.enum(['BASE', 'T1', 'T2', 'T3', 'T4', 'FULL']),
  idGrupoSiguiente: z.string().nullable(),
});

const DisciplinaRowSchema = z.object({
  disciplinaId: zUUID,
  dias: z.array(z.enum(DIAS_VALIDOS)).min(1),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  duracionMinutos: z.number().int().positive(),
});

const CrearGrupoSchema = GrupoBaseSchema.extend({
  categoria: z.enum(['EPIC_TOTZ', 'HAPPY_FEET', 'EPIC_ONE', 'TEEN', 'COMPETICION']),
  disciplinas: z.array(DisciplinaRowSchema),
  precioMensualidad: z.number().min(0),
});

const UpdateCursoEspecialSchema = z
  .object({
    id: zUUID,
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
    tipo: z.enum(['VACACIONES', 'CURSO_VERANO']),
    descripcion: z.string().max(500).nullable(),
    fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria.'),
    fechaFin: z.string().min(1, 'La fecha de fin es obligatoria.'),
    cupo: z.number().int().min(1).max(500),
    precio: z.number().min(0),
    activo: z.boolean(),
    diasSemana: z.array(z.enum(DIAS_VALIDOS)).min(1, 'Selecciona al menos un día.'),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido.'),
    duracionMinutos: z.number().int().positive(),
    profesorId: z.string().nullable(),
  })
  .refine((d) => new Date(d.fechaInicio) < new Date(d.fechaFin), {
    message: 'La fecha de inicio debe ser anterior a la de fin.',
    path: ['fechaFin'],
  });

// ─── 0. Listar profesores activos ──────────────────────────────────────────

export async function getProfesoresActivos() {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getProfesores(tx));
  } catch (err) {
    console.error('[getProfesoresActivos]', err);
    return [];
  }
}

// ─── 0b. Listar salones ─────────────────────────────────────────────────────

export async function getSalones() {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getSalones(tx));
  } catch (err) {
    console.error('[getSalones]', err);
    return [];
  }
}

// ─── 1. Actualizar configuración de un grupo ───────────────────────────────

export async function updateGrupoConfig(
  input: UpdateGrupoInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = UpdateGrupoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, (tx) => svc.updateGrupo(tx, {
      ...parsed.data,
      descripcion: parsed.data.descripcion ?? null,
      profesorId: parsed.data.profesorId ?? null,
      salonId: parsed.data.salonId ?? null,
    }));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[updateGrupoConfig]', err);
    return { ok: false, error: 'No se pudo guardar el grupo.' };
  }
}

// ─── 2. Toggle estrella de competencia ────────────────────────────────────

export async function toggleInvitacionCompetencia(
  alumnaId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!zUUID.safeParse(alumnaId).success) return { ok: false, error: 'ID de alumna inválido.' };

  const session = await getServerSession(authOptions);
  try {
    const res = await withRLS(session, (tx) => svc.toggleInvitacion(tx, alumnaId));
    if (!res.ok) return res;
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[toggleInvitacionCompetencia]', err);
    return { ok: false, error: 'Error al actualizar la estrella.' };
  }
}

// ─── 3. Reasignar alumna a otro grupo ─────────────────────────────────────

export async function reasignarAlumna(
  alumnaId: string,
  grupoDestinoId: string,
  forzar = false,
): Promise<ReasignacionResult> {
  const ids = z.object({ alumnaId: zUUID, grupoDestinoId: zUUID }).safeParse({ alumnaId, grupoDestinoId });
  if (!ids.success) return { ok: false, error: 'IDs inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    const res = await withRLS(session, (tx) =>
      svc.reasignarAlumna(tx, alumnaId, grupoDestinoId, forzar),
    );
    if (res.ok) revalidatePath('/admin/configuracion');
    return res;
  } catch (err) {
    console.error('[reasignarAlumna]', err);
    return { ok: false, error: 'Error interno al reasignar.' };
  }
}

// ─── 4. Leer disciplinas de una alumna en un grupo ────────────────────────

export async function getAlumnaDisciplinasEnGrupo(
  alumnaId: string,
  grupoId: string,
): Promise<string[]> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getAlumnaDisciplinas(tx, alumnaId, grupoId));
  } catch (err) {
    console.error('[getAlumnaDisciplinasEnGrupo]', err);
    return [];
  }
}

// ─── 5. Guardar disciplinas de una alumna en un grupo ─────────────────────

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
    await withRLS(session, (tx) => svc.setAlumnaDisciplinas(tx, alumnaId, grupoId, disciplinaIds));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[setAlumnaDisciplinasEnGrupo]', err);
    return { ok: false, error: 'Error al guardar las disciplinas.' };
  }
}

// ─── 7. Remover alumna de su grupo actual ─────────────────────────────────

export async function removerAlumnaDeGrupo(
  alumnaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, (tx) => svc.removerAlumnaDeGrupo(tx, alumnaId));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[removerAlumnaDeGrupo]', err);
    return { ok: false, error: 'Error al remover alumna del grupo.' };
  }
}

// ─── 8. Remover una disciplina de un grupo ────────────────────────────────

export async function removerDisciplinaDeGrupo(
  grupoId: string,
  disciplinaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, (tx) => svc.removerDisciplinaDeGrupo(tx, grupoId, disciplinaId));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[removerDisciplinaDeGrupo]', err);
    return { ok: false, error: 'Error al remover la disciplina.' };
  }
}

// ─── 9a. Tarifa por tier exacto ───────────────────────────────────────────

export async function getTarifaPorTier(
  categoria: string,
  tier: string,
): Promise<{ precioMensualidad: number } | null> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getTarifaPorTier(tx, categoria, tier));
  } catch (err) {
    console.error('[getTarifaPorTier]', err);
    return null;
  }
}

// ─── 9b. Tarifa de referencia por categoría ───────────────────────────────

export async function getTarifaReferencia(
  categoria: string,
): Promise<{ precioMensualidad: number; precioPreseason: number | null } | null> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getTarifaReferencia(tx, categoria));
  } catch (err) {
    console.error('[getTarifaReferencia]', err);
    return null;
  }
}

// ─── 10. Disciplinas completas de un grupo ────────────────────────────────

export async function getGrupoDisciplinasCompletas(
  grupoId: string,
): Promise<{ disciplinaId: string; dias: string[]; horaInicio: string; duracionMinutos: number; horaTexto: string }[]> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.getGrupoDisciplinasCompletas(tx, grupoId));
  } catch (err) {
    console.error('[getGrupoDisciplinasCompletas]', err);
    return [];
  }
}

// ─── 11. Crear nuevo grupo ────────────────────────────────────────────────

export async function crearGrupo(
  input: CrearGrupoInput,
): Promise<{ ok: true; id: string; resumen: ResumenGrupoCreado } | { ok: false; error: string }> {
  const parsed = CrearGrupoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    const grupoId = await withRLS(session, (tx) => svc.crearGrupo(tx, parsed.data));
    revalidatePath('/admin/configuracion');
    const tier = svc.derivarTier(parsed.data.disciplinas.length);
    return {
      ok: true,
      id: grupoId,
      resumen: {
        nombre: parsed.data.nombre,
        tier,
        numDisciplinas: parsed.data.disciplinas.length,
        precioMensualidad: parsed.data.precioMensualidad,
        activo: parsed.data.activo,
      },
    };
  } catch (err) {
    console.error('[crearGrupo]', err);
    return { ok: false, error: 'Error al crear el grupo.' };
  }
}

// ─── 12. Clonar grupo existente ───────────────────────────────────────────

export async function clonarGrupo(
  origenId: string,
  nuevoNombre: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  try {
    const grupoId = await withRLS(session, (tx) => svc.clonarGrupo(tx, origenId, nuevoNombre));
    revalidatePath('/admin/configuracion');
    return { ok: true, id: grupoId };
  } catch (err) {
    console.error('[clonarGrupo]', err);
    return { ok: false, error: 'Error al clonar el grupo.' };
  }
}

// ─── 13. Datos de un grupo para pre-rellenar el wizard de clonación ──────

export async function obtenerDatosDeClonacion(
  grupoId: string,
): Promise<DatosClonacion | null> {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, (tx) => svc.obtenerDatosDeClonacion(tx, grupoId));
  } catch (err) {
    console.error('[obtenerDatosDeClonacion]', err);
    return null;
  }
}

// ─── 14. Actualizar curso especial ────────────────────────────────────────

export async function updateCursoEspecial(
  input: UpdateCursoEspecialInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = UpdateCursoEspecialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, (tx) => svc.updateCursoEspecial(tx, parsed.data));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[updateCursoEspecial]', err);
    return { ok: false, error: 'Error al guardar el curso especial.' };
  }
}
export async function actualizarPadre(
  padreId: string,
  telefono: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const v = z.object({ padreId: zUUID, telefono: z.string(), email: z.string().email() }).safeParse({ padreId, telefono, email });
  if (!v.success) return { ok: false, error: 'Datos de contacto inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, (tx) => svc.actualizarDatosPadre(tx, padreId, telefono, email));
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[actualizarPadre]', err);
    return { ok: false, error: 'No se pudo actualizar los datos del tutor.' };
  }
}

// ─── 15. Actualizar horario de una disciplina (Drag & Drop) ────────────────

export async function actualizarHorarioClase(
  grupoId: string,
  disciplinaId: string,
  nuevosDias: string[],
  nuevaHoraInicio: string,
): Promise<{ ok: boolean; error?: string }> {
  const v = z.object({
    grupoId: zUUID,
    disciplinaId: zUUID,
    nuevosDias: z.array(z.enum(DIAS_VALIDOS)),
    nuevaHoraInicio: z.string().regex(/^\d{2}:\d{2}$/),
  }).safeParse({ grupoId, disciplinaId, nuevosDias, nuevaHoraInicio });

  if (!v.success) return { ok: false, error: 'Datos de horario inválidos.' };

  const session = await getServerSession(authOptions);
  try {
    await withRLS(session, async (tx) => {
      // 1. Actualizar la tabla pivot GrupoDisciplina
      await tx.grupoDisciplina.update({
        where: { grupoId_disciplinaId: { grupoId, disciplinaId } },
        data: {
          dias: nuevosDias,
          horaInicio: nuevaHoraInicio,
          // Actualizar también el texto amigable para el ticket
          // Necesitamos la duración, la buscamos primero
          ...(await tx.grupoDisciplina.findUnique({
            where: { grupoId_disciplinaId: { grupoId, disciplinaId } },
            select: { duracionMinutos: true }
          }).then(d => d ? {
            horaTexto: buildHoraTexto(nuevosDias, nuevaHoraInicio, d.duracionMinutos)
          } : {}))
        }
      });

      // 2. Si es la "clase principal" del grupo (opcional, para mantener consistencia), 
      // podríamos actualizar el grupo mismo si solo tiene una disciplina.
      // Por ahora, el Mapa de Ocupación lee de GrupoDisciplina, así que esto es lo principal.
    });

    revalidatePath('/admin/grupos');
    revalidatePath('/admin/configuracion');
    return { ok: true };
  } catch (err) {
    console.error('[actualizarHorarioClase]', err);
    return { ok: false, error: 'No se pudo actualizar el horario.' };
  }
}
