import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface DisciplinaPublica {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  color: string | null;
}

// GET /api/disciplinas — público, sin auth (usado en landing page)
export async function GET() {
  try {
    const disciplinas = await prisma.disciplina.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        imagenUrl: true,
        color: true,
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(
      { disciplinas },
      {
        headers: {
          // Cache en CDN por 5 minutos; revalidar en segundo plano si hay visita nueva
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/disciplinas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
