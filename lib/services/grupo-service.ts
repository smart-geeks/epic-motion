import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import type {
  GrupoConfigData,
  UpdateGrupoInput,
  CrearGrupoInput,
  DatosClonacion,
} from '@/types/configuracion';
import type { TipoTierGrupo, CategoriaGrupo } from '@/app/generated/prisma/client';
import { buildHoraTexto } from './common-service';

export function derivarTier(numDisciplinas: number): TipoTierGrupo {
  if (numDisciplinas <= 0) return 'BASE';
  if (numDisciplinas === 1) return 'T1';
  if (numDisciplinas === 2) return 'T2';
  if (numDisciplinas === 3) return 'T3';
  if (numDisciplinas === 4) return 'T4';
  return 'FULL';
}

export async function getGrupos(tx: PrismaTransactionClient): Promise<GrupoConfigData[]> {
  const grupos = await tx.grupo.findMany({
    include: {
      disciplinasGrupo: { include: { disciplina: true } },
      tarifa: { select: { precioMensualidad: true } },
      grupoSiguiente: { select: { nombre: true } },
      profesor: { select: { nombre: true, apellido: true } },
      salon: { select: { id: true, nombre: true } },
      _count: { select: { disciplinas: true } },
    },
    orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
  });
  return grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    categoria: g.categoria,
    esCompetitivo: g.esCompetitivo,
    tier: g.tier,
    edadMin: g.edadMin,
    edadMax: g.edadMax,
    cupo: g.cupo,
    inscritos: g._count.disciplinas,
    activo: g.activo,
    descripcion: g.descripcion,
    idGrupoSiguiente: g.idGrupoSiguiente,
    grupoSiguienteNombre: g.grupoSiguiente?.nombre ?? null,
    profesorId: g.profesorId,
    profesorNombre: g.profesor ? `${g.profesor.nombre} ${g.profesor.apellido}` : null,
    salonId: g.salonId,
    salonNombre: g.salon?.nombre ?? null,
    disciplinas: g.disciplinasGrupo.map((gd) => ({
      id: gd.disciplina.id,
      nombre: gd.disciplina.nombre,
      color: gd.disciplina.color,
      horaTexto: gd.horaTexto,
    })),
    tarifa: g.tarifa ? { precioMensualidad: g.tarifa.precioMensualidad.toNumber() } : null,
  }));
}

export async function updateGrupo(tx: PrismaTransactionClient, data: UpdateGrupoInput): Promise<void> {
  await tx.grupo.update({
    where: { id: data.id },
    data: {
      nombre: data.nombre,
      cupo: data.cupo,
      edadMin: data.edadMin,
      edadMax: data.edadMax,
      tier: data.tier as TipoTierGrupo,
      idGrupoSiguiente: data.idGrupoSiguiente,
      activo: data.activo,
      descripcion: data.descripcion,
      profesorId: data.profesorId,
      salonId: data.salonId,
    },
  });
}

export async function crearGrupo(
  tx: PrismaTransactionClient,
  input: CrearGrupoInput,
): Promise<string> {
  const tier = derivarTier(input.disciplinas.length);
  const esCompetitivo = input.categoria === 'COMPETICION';
  const primera = input.disciplinas[0];
  const horasPorSemana = input.disciplinas.reduce(
    (sum, d) => sum + (d.duracionMinutos / 60) * d.dias.length,
    0,
  );

  const g = await tx.grupo.create({
    data: {
      nombre: input.nombre,
      categoria: input.categoria as CategoriaGrupo,
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
      salonId: input.salonId ?? null,
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
}

export async function clonarGrupo(
  tx: PrismaTransactionClient,
  origenId: string,
  nuevoNombre: string,
): Promise<string> {
  const origen = await tx.grupo.findUnique({
    where: { id: origenId },
    include: { disciplinasGrupo: true, tarifa: true },
  });
  if (!origen) throw new Error('Grupo origen no encontrado.');

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
}

export async function removerDisciplinaDeGrupo(
  tx: PrismaTransactionClient,
  grupoId: string,
  disciplinaId: string,
): Promise<void> {
  await tx.grupoDisciplina.delete({
    where: { grupoId_disciplinaId: { grupoId, disciplinaId } },
  });
}

export async function getGrupoDisciplinasCompletas(
  tx: PrismaTransactionClient,
  grupoId: string,
): Promise<{ disciplinaId: string; dias: string[]; horaInicio: string; duracionMinutos: number; horaTexto: string }[]> {
  return tx.grupoDisciplina.findMany({
    where: { grupoId },
    select: { disciplinaId: true, dias: true, horaInicio: true, duracionMinutos: true, horaTexto: true },
  });
}

export async function getTarifaPorTier(
  tx: PrismaTransactionClient,
  categoria: string,
  tier: string,
): Promise<{ precioMensualidad: number } | null> {
  const grupo = await tx.grupo.findFirst({
    where: {
      categoria: categoria as CategoriaGrupo,
      tier: tier as TipoTierGrupo,
      activo: true,
      tarifa: { isNot: null },
    },
    select: { tarifa: { select: { precioMensualidad: true } } },
  });
  return grupo?.tarifa ? { precioMensualidad: grupo.tarifa.precioMensualidad.toNumber() } : null;
}

export async function obtenerDatosDeClonacion(
  tx: PrismaTransactionClient,
  grupoId: string,
): Promise<DatosClonacion | null> {
  const grupo = await tx.grupo.findUnique({
    where: { id: grupoId },
    include: {
      disciplinasGrupo: true,
      tarifa: { select: { precioMensualidad: true } },
    },
  });
  if (!grupo) return null;

  return {
    id: grupo.id,
    nombre: grupo.nombre,
    categoria: grupo.categoria,
    edadMin: grupo.edadMin,
    edadMax: grupo.edadMax,
    cupo: grupo.cupo,
    activo: grupo.activo,
    descripcion: grupo.descripcion,
    profesorId: grupo.profesorId,
    salonId: grupo.salonId,
    precioMensualidad: grupo.tarifa?.precioMensualidad.toNumber() ?? null,
    disciplinas: grupo.disciplinasGrupo.map((gd) => ({
      disciplinaId: gd.disciplinaId,
      dias: gd.dias,
      horaInicio: gd.horaInicio,
      duracionMinutos: gd.duracionMinutos,
      horaTexto: gd.horaTexto,
    })),
  };
}

export async function getTarifaReferencia(
  tx: PrismaTransactionClient,
  categoria: string,
): Promise<{ precioMensualidad: number; precioPreseason: number | null } | null> {
  const full = await tx.grupo.findFirst({
    where: { categoria: categoria as CategoriaGrupo, tier: 'FULL', activo: true, tarifa: { isNot: null } },
    select: { tarifa: { select: { precioMensualidad: true, precioPreseason: true } } },
  });
  if (full?.tarifa) {
    return {
      precioMensualidad: full.tarifa.precioMensualidad.toNumber(),
      precioPreseason: full.tarifa.precioPreseason?.toNumber() ?? null,
    };
  }
  const fallback = await tx.grupo.findFirst({
    where: { categoria: categoria as CategoriaGrupo, activo: true, tarifa: { isNot: null } },
    select: { tarifa: { select: { precioMensualidad: true, precioPreseason: true } } },
  });
  if (fallback?.tarifa) {
    return {
      precioMensualidad: fallback.tarifa.precioMensualidad.toNumber(),
      precioPreseason: fallback.tarifa.precioPreseason?.toNumber() ?? null,
    };
  }
  return null;
}
