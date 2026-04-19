import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

export interface CursoEspecialData {
  id: string;
  nombre: string;
  tipo: 'VACACIONES' | 'CURSO_VERANO';
  descripcion: string | null;
  fechaInicio: string; // ISO string
  fechaFin: string;    // ISO string
  cupo: number;
  inscritas: number;
  precio: number;
  activo: boolean;
  diasSemana: string[];
  horaInicio: string;
  duracionMinutos: number;
  profesorId: string | null;
  profesorNombre: string | null;
}

// GET /api/configuracion/cursos-especiales
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cursos = await withRLS(session, (tx) =>
      tx.cursoEspecial.findMany({
        orderBy: [{ fechaInicio: 'asc' }, { nombre: 'asc' }],
        include: {
          profesor: { select: { nombre: true, apellido: true } },
          _count: { select: { inscritas: true } },
        },
      }),
    );

    const resultado: CursoEspecialData[] = cursos.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      descripcion: c.descripcion,
      fechaInicio: c.fechaInicio.toISOString(),
      fechaFin: c.fechaFin.toISOString(),
      cupo: c.cupo,
      inscritas: c._count.inscritas,
      precio: c.precio.toNumber(),
      activo: c.activo,
      diasSemana: c.diasSemana,
      horaInicio: c.horaInicio,
      duracionMinutos: c.duracionMinutos,
      profesorId: c.profesorId,
      profesorNombre: c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido}` : null,
    }));

    return NextResponse.json({ cursos: resultado });
  } catch (err) {
    console.error('[GET /api/configuracion/cursos-especiales]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
