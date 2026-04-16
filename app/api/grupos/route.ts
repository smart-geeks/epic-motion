import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import type { GrupoCard } from '@/types/inscripciones';

// GET /api/grupos
// Devuelve grupos activos con sus disciplinas, tarifa e inscritos actuales.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const grupos = await withRLS(session, (tx) =>
      tx.grupo.findMany({
        where: { activo: true },
        include: {
          disciplinasGrupo: {
            include: { disciplina: true },
          },
          tarifa: true,
          _count: {
            select: { disciplinas: true }, // cuenta AlumnaClase vinculados al grupo
          },
        },
        orderBy: { nombre: 'asc' },
      })
    );

    // Mapear a GrupoCard[] serializando Decimal → number
    const resultado: GrupoCard[] = grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      edadMin: g.edadMin,
      edadMax: g.edadMax,
      horasPorSemana: g.horasPorSemana.toNumber(),
      dias: g.dias,
      horaInicio: g.horaInicio,
      duracionMinutos: g.duracionMinutos,
      cupo: g.cupo,
      inscritos: g._count.disciplinas,
      disciplinas: g.disciplinasGrupo.map((gd) => ({
        id: gd.disciplina.id,
        nombre: gd.disciplina.nombre,
        color: gd.disciplina.color,
      })),
      tarifa: g.tarifa
        ? {
            id: g.tarifa.id,
            precioMensualidad: g.tarifa.precioMensualidad.toNumber(),
            precioPreseason: g.tarifa.precioPreseason.toNumber(),
          }
        : null,
    }));

    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[GET /api/grupos]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
