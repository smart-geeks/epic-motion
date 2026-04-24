import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import StudentsManager from './StudentsManager';

// Carga lista de inscripciones (alumnas registradas)
async function obtenerAlumnasRegistradas() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const alumnas = await withRLS(session, (tx) =>
    tx.alumna.findMany({
      include: {
        clases: {
          where: { grupoId: { not: null } },
          include: {
            grupo: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })
  );

  // Adaptamos al formato que espera StudentsManager
  // Unimos los nombres de los grupos si tiene más de uno
  return alumnas.map(a => ({
    id: a.id, // Usamos el ID de la alumna para evitar duplicados
    alumna: {
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      estatus: a.estatus,
      fechaInscripcion: a.fechaInscripcion,
    },
    // Para la visualización en la tabla, concatenamos los grupos
    grupo: a.clases.length > 0 ? {
      id: a.clases.map(c => c.grupo?.id).join(','),
      nombre: a.clases.map(c => c.grupo?.nombre).join(', ')
    } : null,
  }));
}

export default async function AlumnasPage() {
  const alumnas = await obtenerAlumnasRegistradas();

  return (
    <div className="container mx-auto">
      <StudentsManager alumnas={alumnas as any} />
    </div>
  );
}
