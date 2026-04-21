import { prisma } from '@/lib/prisma';

export async function obtenerDashboardProfesor(profesorId: string) {
  return await prisma.usuario.findUnique({
    where: { id: profesorId },
    include: {
      gruposComoProfesor: {
        where: { activo: true },
        include: {
          _count: {
            select: { disciplinas: true } // Alumnas inscritas
          }
        }
      },
      profesor: true
    }
  });
}

export async function obtenerAlumnasPorGrupo(grupoId: string) {
  return await prisma.alumnaClase.findMany({
    where: { grupoId },
    include: {
      alumna: true
    }
  });
}

export async function checkInProfesor(profesorId: string, sesionId: string) {
  return await prisma.sesion.update({
    where: { 
      id: sesionId,
      profesorId: profesorId
    },
    data: {
      estado: 'INICIADA',
      checkinAt: new Date()
    }
  });
}

export async function obtenerAlertasPuntualidad() {
  const ahora = new Date();
  
  // Buscar sesiones que deberían haber empezado hace más de 5 minutos y no han iniciado por falta de check-in
  const hace5Minutos = new Date(ahora.getTime() - 5 * 60000);

  return await prisma.sesion.findMany({
    where: {
      horaInicio: {
        lte: hace5Minutos,
        // Eliminamos el filtro de gte Date(ahora.setHours(0,0,0,0)) por ahora para simplificar 
        // o lo agregamos correctamente
      },
      estado: 'PROGRAMADA',
      checkinAt: null
    },
    include: {
      profesor: {
        select: {
          nombre: true,
          apellido: true
        }
      },
      clase: {
        select: {
          nombre: true
        }
      }
    }
  });
}
