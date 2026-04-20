import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import type { 
  CursoEspecialData, 
  UpdateCursoEspecialInput 
} from '@/types/configuracion';

export async function getCursosEspeciales(tx: PrismaTransactionClient): Promise<CursoEspecialData[]> {
  const cursos = await tx.cursoEspecial.findMany({
    orderBy: [{ fechaInicio: 'asc' }, { nombre: 'asc' }],
    include: {
      profesor: { select: { nombre: true, apellido: true } },
      _count: { select: { inscritas: true } },
    },
  });
  return cursos.map((c) => ({
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
}

export async function updateCursoEspecial(
  tx: PrismaTransactionClient,
  data: UpdateCursoEspecialInput,
): Promise<void> {
  await tx.cursoEspecial.update({
    where: { id: data.id },
    data: {
      nombre: data.nombre,
      tipo: data.tipo,
      descripcion: data.descripcion,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      cupo: data.cupo,
      precio: data.precio,
      activo: data.activo,
      diasSemana: data.diasSemana,
      horaInicio: data.horaInicio,
      duracionMinutos: data.duracionMinutos,
      profesorId: data.profesorId,
    },
  });
}
