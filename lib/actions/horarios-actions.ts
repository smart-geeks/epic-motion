'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

export async function getGrupoAsistencia(grupoId: string) {
  const session = await getServerSession(authOptions);
  try {
    return await withRLS(session, async (tx) => {
      // Find the group's enrolled students
      const alumnas = await tx.alumnaClase.findMany({
        where: { grupoId },
        include: {
          alumna: {
            select: { id: true, nombre: true, apellido: true, foto: true }
          }
        }
      });
      
      // Filter out duplicates if multiple disciplines are linked
      const uniqueAlumnas = new Map();
      alumnas.forEach(a => {
        if (!uniqueAlumnas.has(a.alumnaId)) {
          uniqueAlumnas.set(a.alumnaId, a.alumna);
        }
      });
      return { ok: true, alumnas: Array.from(uniqueAlumnas.values()) };
    });
  } catch (error) {
    console.error(error);
    return { ok: false, error: 'Failed to fetch attendance.' };
  }
}
