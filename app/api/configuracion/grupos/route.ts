import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

export interface GrupoConfigData {
  id: string;
  nombre: string;
  categoria: string;
  esCompetitivo: boolean;
  tier: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  inscritos: number;
  activo: boolean;
  descripcion: string | null;
  idGrupoSiguiente: string | null;
  grupoSiguienteNombre: string | null;
  profesorId: string | null;
  profesorNombre: string | null;
  disciplinas: { id: string; nombre: string; color: string | null; horaTexto: string }[];
  tarifa: { precioMensualidad: number } | null;
}

// GET /api/configuracion/grupos — Admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const grupos = await withRLS(session, (tx) =>
      tx.grupo.findMany({
        include: {
          disciplinasGrupo: { include: { disciplina: true } },
          tarifa: { select: { precioMensualidad: true } },
          grupoSiguiente: { select: { nombre: true } },
          profesor: { select: { nombre: true, apellido: true } },
          _count: { select: { disciplinas: true } },
        },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
      }),
    );

    const result: GrupoConfigData[] = grupos.map((g) => ({
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
      disciplinas: g.disciplinasGrupo.map((gd) => ({
        id: gd.disciplina.id,
        nombre: gd.disciplina.nombre,
        color: gd.disciplina.color,
        horaTexto: gd.horaTexto,
      })),
      tarifa: g.tarifa ? { precioMensualidad: g.tarifa.precioMensualidad.toNumber() } : null,
    }));

    return NextResponse.json({ grupos: result });
  } catch (err) {
    console.error('[GET /api/configuracion/grupos]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
