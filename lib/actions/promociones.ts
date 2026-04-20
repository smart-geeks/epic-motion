'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { ejecutarPromocionMasiva } from '@/lib/services/promocion-service';

export interface AccionPromocionResult {
  ok: true;
  promovidas: number;
  sinGrupoSiguiente: number;
  errores: { alumnaId: string; detalle: string }[];
  mensaje: string;
}

export async function accionEjecutarPromocion(): Promise<AccionPromocionResult> {
  const session = await getServerSession(authOptions);

  if (session?.user?.rol !== 'ADMIN') {
    throw new Error('Solo los administradores pueden ejecutar una promoción de ciclo.');
  }

  const resultado = await withRLS(session, (tx) => ejecutarPromocionMasiva(tx));

  const partes: string[] = [];
  if (resultado.promovidas > 0) {
    partes.push(`${resultado.promovidas} alumna${resultado.promovidas !== 1 ? 's' : ''} promovida${resultado.promovidas !== 1 ? 's' : ''}`);
  }
  if (resultado.sinGrupoSiguiente > 0) {
    partes.push(`${resultado.sinGrupoSiguiente} sin grupo siguiente configurado`);
  }
  if (resultado.errores.length > 0) {
    partes.push(`${resultado.errores.length} error${resultado.errores.length !== 1 ? 'es' : ''}`);
  }

  const mensaje =
    resultado.promovidas === 0 && resultado.errores.length === 0
      ? 'No hay alumnas pendientes de promoción.'
      : partes.join(' · ');

  return {
    ok: true,
    promovidas: resultado.promovidas,
    sinGrupoSiguiente: resultado.sinGrupoSiguiente,
    errores: resultado.errores,
    mensaje,
  };
}
