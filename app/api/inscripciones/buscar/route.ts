import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import type { AlumnaBusqueda } from '@/types/inscripciones';

// GET /api/inscripciones/buscar?q=Sofia+Perez
// Busca alumnas para el flujo de reinscripción.
// Solo accesible para ADMIN y RECEPCIONISTA.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rol = session.user?.rol;
    if (rol !== 'ADMIN' && rol !== 'RECEPCIONISTA') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) {
      return NextResponse.json({ error: 'Búsqueda mínima: 2 caracteres' }, { status: 400 });
    }

    const terminos = q.split(/\s+/);

    const alumnas = await withRLS(session, (tx) =>
      tx.alumna.findMany({
        where: {
          AND: terminos.map((t) => ({
            OR: [
              { nombre: { contains: t, mode: 'insensitive' } },
              { apellido: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          fechaNacimiento: true,
          estatus: true,
          padre: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true,
              telefonoTrabajo: true,
              nombreConyuge: true,
              celularConyuge: true,
              emailConyuge: true,
              telefonoTrabajoConyuge: true,
              domicilio: true,
            },
          },
        },
        take: 10,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      })
    );

    const resultado: AlumnaBusqueda[] = alumnas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      fechaNacimiento: a.fechaNacimiento.toISOString(),
      estatus: a.estatus,
      padre: {
        id: a.padre.id,
        nombre: a.padre.nombre,
        apellido: a.padre.apellido,
        email: a.padre.email,
        telefono: a.padre.telefono,
        telefonoTrabajo: a.padre.telefonoTrabajo,
        nombreConyuge: a.padre.nombreConyuge,
        celularConyuge: a.padre.celularConyuge,
        emailConyuge: a.padre.emailConyuge,
        telefonoTrabajoConyuge: a.padre.telefonoTrabajoConyuge,
        domicilio: a.padre.domicilio,
      },
    }));

    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[GET /api/inscripciones/buscar]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
