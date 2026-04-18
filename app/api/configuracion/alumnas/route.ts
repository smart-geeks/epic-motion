import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

export interface AlumnaConfigData {
  id: string;
  nombre: string;
  apellido: string;
  foto: string | null;
  fechaNacimiento: string;
  estatus: string;
  invitadaCompetencia: boolean;
  grupoActual: { id: string; nombre: string } | null;
  cargosPendientes: number;
  cargosVencidos: number;
  montoDeuda: number;
}

// GET /api/configuracion/alumnas — Admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const alumnas = await withRLS(session, (tx) =>
      tx.alumna.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          foto: true,
          fechaNacimiento: true,
          estatus: true,
          invitadaCompetencia: true,
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
      }),
    );

    const result: AlumnaConfigData[] = alumnas.map((a) => {
      const pendientes = a.cargos.filter((c) => c.estado === 'PENDIENTE');
      const vencidos = a.cargos.filter((c) => c.estado === 'VENCIDO');
      const montoDeuda = a.cargos.reduce((sum, c) => sum + c.montoFinal.toNumber(), 0);

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
        montoDeuda,
      };
    });

    return NextResponse.json({ alumnas: result });
  } catch (err) {
    console.error('[GET /api/configuracion/alumnas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
