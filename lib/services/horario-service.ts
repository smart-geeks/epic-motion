import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import { CategoriaGrupo } from '@/app/generated/prisma/client';

export async function getHorariosData(tx: PrismaTransactionClient) {
  const [salones, grupos] = await Promise.all([
    tx.salon.findMany({
      orderBy: { nombre: 'asc' }
    }),
    tx.grupo.findMany({
      where: { activo: true },
      include: {
        disciplinasGrupo: {
          include: {
            disciplina: true
          }
        },
        profesor: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: {
            disciplinas: true
          }
        }
      }
    })
  ]);

  return {
    salones,
    grupos: grupos.map(g => ({
      id: g.id,
      nombre: g.nombre,
      categoria: g.categoria,
      cupo: g.cupo,
      inscritos: g._count.disciplinas,
      profesor: g.profesor ? `${g.profesor.nombre} ${g.profesor.apellido}` : 'Sin asignar',
      salonId: g.salonId,
      disciplinas: g.disciplinasGrupo.map(gd => ({
        id: gd.disciplina.id,
        nombre: gd.disciplina.nombre,
        color: gd.disciplina.color,
        dias: gd.dias,
        horaInicio: gd.horaInicio,
        duracionMinutos: gd.duracionMinutos
      }))
    }))
  };
}
