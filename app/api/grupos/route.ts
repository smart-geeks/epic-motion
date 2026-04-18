import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import type { GrupoCard } from '@/types/inscripciones';

function calcularCicloEscolar(): string {
  const ahora = new Date();
  const mes = ahora.getMonth(); // 0 = enero
  const anio = ahora.getFullYear();
  const inicio = mes >= 7 ? anio : anio - 1;
  return `Agosto ${inicio} – Junio ${inicio + 1}`;
}

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
      categoria: g.categoria,
      esCompetitivo: g.esCompetitivo,
      tier: g.tier,
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
        horaTexto: gd.horaTexto,
      })),
      tarifa: g.tarifa
        ? {
            id: g.tarifa.id,
            precioMensualidad: g.tarifa.precioMensualidad.toNumber(),
            precioPreseason: g.tarifa.precioPreseason.toNumber(),
          }
        : null,
    }));

    return NextResponse.json({ grupos: resultado, cicloEscolar: calcularCicloEscolar() });
  } catch (err) {
    console.error('[GET /api/grupos]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
