import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

export interface DisciplinaConfigData {
  id: string;
  nombre: string;
  color: string | null;
}

// GET /api/configuracion/disciplinas — Admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const disciplinas = await withRLS(session, (tx) =>
      tx.disciplina.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, color: true },
        orderBy: { nombre: 'asc' },
      }),
    );

    return NextResponse.json({ disciplinas });
  } catch (err) {
    console.error('[GET /api/configuracion/disciplinas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
