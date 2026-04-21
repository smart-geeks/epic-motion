import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import StudentsManager from './StudentsManager';

// Carga lista de inscripciones (alumnas registradas)
async function obtenerAlumnasRegistradas() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const inscripciones = await withRLS(session, (tx) =>
    tx.alumnaClase.findMany({
      where: { grupoId: { not: null } },
      include: {
        alumna: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            estatus: true,
            fechaInscripcion: true,
          },
        },
        grupo: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { alumna: { nombre: 'asc' } },
      take: 200,
    })
  );

  return inscripciones;
}

export default async function AlumnasPage() {
  const alumnas = await obtenerAlumnasRegistradas();

  return (
    <div className="container mx-auto">
      <StudentsManager alumnas={alumnas as any} />
    </div>
  );
}
