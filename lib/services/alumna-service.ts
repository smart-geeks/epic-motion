import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import type { 
  AlumnaConfigData, 
  ReasignacionResult 
} from '@/types/configuracion';
import { calcularMonto } from '@/lib/logic/precios';
import { calcularEdadCiclo } from './common-service';

export async function getAlumnas(tx: PrismaTransactionClient): Promise<AlumnaConfigData[]> {
  const alumnas = await tx.alumna.findMany({
    select: {
      id: true, nombre: true, apellido: true, foto: true,
      fechaNacimiento: true, estatus: true, invitadaCompetencia: true,
      clases: {
        where: { grupoId: { not: null } },
        select: { grupo: { select: { id: true, nombre: true } } },
        take: 1,
      },
      cargos: {
        where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
        select: { estado: true, montoFinal: true },
      },
    },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });
  return alumnas.map((a) => {
    const pendientes = a.cargos.filter((c) => c.estado === 'PENDIENTE');
    const vencidos = a.cargos.filter((c) => c.estado === 'VENCIDO');
    return {
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      foto: a.foto,
      fechaNacimiento: a.fechaNacimiento.toISOString(),
      estatus: a.estatus,
      invitadaCompetencia: a.invitadaCompetencia,
      grupoActual: a.clases[0]?.grupo ?? null,
      cargosPendientes: pendientes.length,
      cargosVencidos: vencidos.length,
      montoDeuda: a.cargos.reduce((sum, c) => sum + c.montoFinal.toNumber(), 0),
    };
  });
}

export async function toggleInvitacion(
  tx: PrismaTransactionClient,
  alumnaId: string,
): Promise<{ ok: true; nuevoValor: boolean } | { ok: false; error: string }> {
  const alumna = await tx.alumna.findUnique({
    where: { id: alumnaId },
    select: { invitadaCompetencia: true },
  });
  if (!alumna) return { ok: false, error: 'Alumna no encontrada.' };
  await tx.alumna.update({
    where: { id: alumnaId },
    data: { invitadaCompetencia: !alumna.invitadaCompetencia },
  });
  return { ok: true, nuevoValor: !alumna.invitadaCompetencia };
}

export async function reasignarAlumna(
  tx: PrismaTransactionClient,
  alumnaId: string,
  grupoDestinoId: string,
  forzar: boolean,
): Promise<ReasignacionResult> {
  const [alumna, grupoDestino] = await Promise.all([
    tx.alumna.findUnique({ where: { id: alumnaId }, select: { fechaNacimiento: true } }),
    tx.grupo.findUnique({
      where: { id: grupoDestinoId },
      select: { cupo: true, edadMin: true, edadMax: true },
    }),
  ]);

  if (!alumna || !grupoDestino) return { ok: false, error: 'Alumna o grupo no encontrado.' };

  const inscritasDestino = await tx.alumnaClase.findMany({
    where: { grupoId: grupoDestinoId },
    select: { alumnaId: true },
    distinct: ['alumnaId'],
  });

  if (inscritasDestino.length >= grupoDestino.cupo) {
    return { ok: false, error: `El grupo destino no tiene lugares disponibles (${grupoDestino.cupo}/${grupoDestino.cupo}).` };
  }

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

  await tx.alumnaClase.updateMany({
    where: { alumnaId },
    data: { grupoId: grupoDestinoId },
  });
  return { ok: true };
}

export async function setAlumnaDisciplinas(
  tx: PrismaTransactionClient,
  alumnaId: string,
  grupoId: string,
  disciplinaIds: string[],
): Promise<void> {
  await tx.alumnaDisciplina.deleteMany({ where: { alumnaId, grupoId } });

  if (disciplinaIds.length > 0) {
    await tx.alumnaDisciplina.createMany({
      data: disciplinaIds.map((disciplinaId) => ({ alumnaId, grupoId, disciplinaId })),
    });
  }

  const [tarifa, totalDiscs] = await Promise.all([
    tx.tarifaMensualidad.findUnique({ where: { grupoId } }),
    tx.grupoDisciplina.count({ where: { grupoId } }),
  ]);
  const montoNuevo = calcularMonto(
    tarifa?.precioMensualidad.toNumber() ?? 0,
    totalDiscs,
    disciplinaIds.length,
  );

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
}

export async function removerAlumnaDeGrupo(tx: PrismaTransactionClient, alumnaId: string): Promise<void> {
  await tx.alumnaClase.updateMany({
    where: { alumnaId },
    data: { grupoId: null },
  });
}

export async function getAlumnaDisciplinas(
  tx: PrismaTransactionClient,
  alumnaId: string,
  grupoId: string,
): Promise<string[]> {
  const records = await tx.alumnaDisciplina.findMany({
    where: { alumnaId, grupoId },
    select: { disciplinaId: true },
  });
  return records.map((r) => r.disciplinaId);
}
