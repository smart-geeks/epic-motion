'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene el resumen de las hermanas de una alumna (mismo padreId)
 */
export async function getHermanasSummary(alumnaId: string, padreId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('No autorizado');

  return withRLS(session, async (tx) => {
    const hermanas = await tx.alumna.findMany({
      where: {
        padreId,
        id: { not: alumnaId }
      },
      include: {
        clases: {
          include: {
            grupo: { select: { nombre: true } }
          },
          take: 1
        },
        cargos: {
          where: { estado: 'PENDIENTE' },
          select: { montoFinal: true }
        }
      }
    });

    return hermanas.map(h => ({
      id: h.id,
      nombre: h.nombre,
      apellido: h.apellido,
      foto: h.foto,
      estatus: h.estatus,
      grupoNombre: h.clases[0]?.grupo?.nombre ?? 'Sin grupo',
      deudaTotal: h.cargos.reduce((acc, c) => acc + Number(c.montoFinal), 0)
    }));
  });
}

/**
 * Busca alumnas por nombre para asociarlas como hermanas
 */
export async function buscarAlumnasParaAsociar(query: string, excludePadreId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('No autorizado');

  return withRLS(session, async (tx) => {
    return tx.alumna.findMany({
      where: {
        AND: [
          {
            OR: [
              { nombre: { contains: query, mode: 'insensitive' } },
              { apellido: { contains: query, mode: 'insensitive' } }
            ]
          },
          { padreId: { not: excludePadreId } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        foto: true,
        padre: {
          select: { nombre: true, apellido: true }
        }
      },
      take: 5
    });
  });
}

/**
 * Asocia una alumna a un nuevo padre (creando el vínculo de hermanas)
 */
export async function asociarHermana(alumnaAAsociarId: string, nuevoPadreId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('No autorizado');

  return withRLS(session, async (tx) => {
    await tx.alumna.update({
      where: { id: alumnaAAsociarId },
      data: { padreId: nuevoPadreId }
    });
    
    // También deberíamos mover los cargos si el responsable cambia? 
    // En este sistema los cargos cuelgan del padreId también.
    // Vamos a moverlos para mantener consistencia financiera.
    await tx.cargo.updateMany({
      where: { alumnaId: alumnaAAsociarId },
      data: { padreId: nuevoPadreId }
    });

    await tx.pago.updateMany({
      where: { alumnaId: alumnaAAsociarId },
      data: { padreId: nuevoPadreId }
    });

    revalidatePath('/admin/alumnas');
    return { ok: true };
  });
}
