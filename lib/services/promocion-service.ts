import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import { calcularMonto } from '@/lib/logic/precios';

export interface ResultadoPromocion {
  promovidas: number;
  sinGrupoSiguiente: number;
  errores: { alumnaId: string; detalle: string }[];
}

/**
 * Promueve todas las alumnas activas al grupo siguiente configurado.
 *
 * Por cada combinación única (alumnaId, grupoId) en AlumnaClase:
 *   1. Si el grupo tiene idGrupoSiguiente → mueve grupoId al nuevo grupo.
 *   2. Recalcula el monto del cargo PENDIENTE más reciente con la tarifa del nuevo grupo.
 *
 * Toda la operación ocurre en una sola transacción Prisma (la que provee withRLS).
 */
export async function ejecutarPromocionMasiva(
  tx: PrismaTransactionClient,
): Promise<ResultadoPromocion> {
  // ── 1. Obtener todas las inscripciones con grupoId asignado ──────────────────
  const inscripciones = await tx.alumnaClase.findMany({
    where: { grupoId: { not: null } },
    select: { id: true, alumnaId: true, grupoId: true },
  });

  // ── 2. Agrupar por (alumnaId, grupoId) ──────────────────────────────────────
  const mapa = new Map<string, { alumnaId: string; grupoId: string; ids: string[] }>();
  for (const row of inscripciones) {
    if (!row.grupoId) continue;
    const key = `${row.alumnaId}::${row.grupoId}`;
    const entry = mapa.get(key);
    if (entry) {
      entry.ids.push(row.id);
    } else {
      mapa.set(key, { alumnaId: row.alumnaId, grupoId: row.grupoId, ids: [row.id] });
    }
  }

  if (mapa.size === 0) {
    return { promovidas: 0, sinGrupoSiguiente: 0, errores: [] };
  }

  // ── 3. Cargar grupos actuales que tengan grupo siguiente ─────────────────────
  const grupoIdsActuales = Array.from(new Set(Array.from(mapa.values()).map((v) => v.grupoId)));

  const gruposActuales = await tx.grupo.findMany({
    where: { id: { in: grupoIdsActuales }, idGrupoSiguiente: { not: null } },
    select: { id: true, idGrupoSiguiente: true },
  });

  const grupoSiguienteMap = new Map(
    gruposActuales.map((g) => [g.id, g.idGrupoSiguiente!]),
  );

  // ── 4. Cargar tarifa y total de disciplinas de los grupos destino ────────────
  const grupoIdsDestino = Array.from(new Set(gruposActuales.map((g) => g.idGrupoSiguiente!)));

  const gruposDestino = await tx.grupo.findMany({
    where: { id: { in: grupoIdsDestino } },
    select: {
      id: true,
      tarifa: { select: { precioMensualidad: true } },
      disciplinasGrupo: { select: { disciplinaId: true } },
    },
  });

  const grupoDestinoMap = new Map(gruposDestino.map((g) => [g.id, g]));

  // ── 5. Ejecutar promociones ──────────────────────────────────────────────────
  let promovidas = 0;
  let sinGrupoSiguiente = 0;
  const errores: { alumnaId: string; detalle: string }[] = [];

  for (const { alumnaId, grupoId, ids } of Array.from(mapa.values())) {
    const nuevoGrupoId = grupoSiguienteMap.get(grupoId);

    if (!nuevoGrupoId) {
      sinGrupoSiguiente++;
      continue;
    }

    const grupoDestino = grupoDestinoMap.get(nuevoGrupoId);
    if (!grupoDestino) {
      errores.push({ alumnaId, detalle: `Grupo destino ${nuevoGrupoId} no encontrado` });
      continue;
    }

    try {
      // 5a. Actualizar grupoId en todos los registros AlumnaClase de esta alumna-grupo
      await tx.alumnaClase.updateMany({
        where: { id: { in: ids } },
        data: { grupoId: nuevoGrupoId },
      });

      // 5b. Recalcular mensualidad proporcional y actualizar cargo PENDIENTE más reciente
      const tarifaNueva = grupoDestino.tarifa?.precioMensualidad.toNumber() ?? 0;
      const totalDisciplinas = grupoDestino.disciplinasGrupo.length || 1;
      const seleccionadas = Math.min(ids.length, totalDisciplinas);
      const nuevoMonto = calcularMonto(tarifaNueva, totalDisciplinas, seleccionadas);

      const cargoPendiente = await tx.cargo.findFirst({
        where: { alumnaId, grupoId, estado: 'PENDIENTE' },
        orderBy: { createdAt: 'desc' },
      });

      if (cargoPendiente) {
        await tx.cargo.update({
          where: { id: cargoPendiente.id },
          data: {
            montoFinal: nuevoMonto,
            grupoId: nuevoGrupoId,
          },
        });
      }

      promovidas++;
    } catch (e) {
      errores.push({
        alumnaId,
        detalle: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  }

  return { promovidas, sinGrupoSiguiente, errores };
}
