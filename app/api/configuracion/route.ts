import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

// GET /api/configuracion?claves=cuota_inscripcion,dia_corte_global
// Devuelve un mapa { clave: valor } para las claves solicitadas.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clavesParam = req.nextUrl.searchParams.get('claves');
    if (!clavesParam) {
      return NextResponse.json({ error: 'Parámetro "claves" requerido' }, { status: 400 });
    }

    const claves = clavesParam.split(',').map((c) => c.trim()).filter(Boolean);
    if (claves.length === 0) {
      return NextResponse.json({});
    }

    const registros = await withRLS(session, (tx) =>
      tx.configuracion.findMany({
        where: { clave: { in: claves } },
        select: { clave: true, valor: true },
      })
    );

    // Construir mapa { clave: valor }
    const mapa: Record<string, string> = {};
    for (const r of registros) {
      mapa[r.clave] = r.valor;
    }

    return NextResponse.json(mapa);
  } catch (err) {
    console.error('[GET /api/configuracion]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
