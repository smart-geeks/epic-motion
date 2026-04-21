import { prisma } from '@/lib/prisma';
import { Rol } from '@/app/generated/prisma/enums';

export async function obtenerTodoElStaff() {
  return await prisma.usuario.findMany({
    where: {
      rol: {
        in: [Rol.ADMIN, Rol.MAESTRO, Rol.RECEPCIONISTA]
      }
    },
    include: {
      profesor: true
    },
    orderBy: {
      nombre: 'asc'
    }
  });
}

export async function obtenerStaffPorId(id: string) {
  return await prisma.usuario.findUnique({
    where: { id },
    include: {
      profesor: true,
      gruposComoProfesor: {
        where: { activo: true }
      }
    }
  });
}

export async function crearStaff(data: {
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  telefono?: string;
  especialidades?: string[];
  tarifaHora?: number;
}) {
  return await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        telefono: data.telefono,
        // Password temporal que debería ser cambiada (en un sistema real se enviaría email de invitación)
        password: '$2b$10$temporary-hashed-password', 
      }
    });

    if (data.rol === Rol.MAESTRO) {
      await tx.profesor.create({
        data: {
          usuarioId: usuario.id,
          tarifaHora: data.tarifaHora || 0,
          especialidades: data.especialidades || []
        }
      });
    }

    return usuario;
  });
}

export async function actualizarStaff(id: string, data: {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: Rol;
  telefono?: string;
  especialidades?: string[];
  tarifaHora?: number;
  activo?: boolean;
}) {
  return await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.update({
      where: { id },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        telefono: data.telefono,
        activo: data.activo
      }
    });

    if (usuario.rol === Rol.MAESTRO) {
      await tx.profesor.upsert({
        where: { usuarioId: id },
        create: {
          usuarioId: id,
          tarifaHora: data.tarifaHora || 0,
          especialidades: data.especialidades || []
        },
        update: {
          tarifaHora: data.tarifaHora,
          especialidades: data.especialidades
        }
      });
    }

    return usuario;
  });
}
