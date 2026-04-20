import { PrismaTransactionClient } from '@/lib/prisma-rls';
import type { GrupoCard } from '@/types/inscripciones';

export function calcularCicloEscolar(): string {
  const ahora = new Date();
  const mes = ahora.getMonth(); // 0 = enero
  const anio = ahora.getFullYear();
  const inicio = mes >= 7 ? anio : anio - 1;
  return `Agosto ${inicio} – Junio ${inicio + 1}`;
}

export async function getGruposParaInscripcion(tx: PrismaTransactionClient): Promise<GrupoCard[]> {
  const grupos = await tx.grupo.findMany({
    where: { activo: true },
    include: {
      disciplinasGrupo: {
        include: { disciplina: true },
      },
      tarifa: true,
      _count: {
        select: { disciplinas: true },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  return grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    categoria: g.categoria,
    esCompetitivo: g.esCompetitivo,
    tier: g.tier,
    edadMin: g.edadMin,
    edadMax: g.edadMax,
    horasPorSemana: g.horasPorSemana.toNumber(),
    dias: g.dias,
    horaInicio: g.horaInicio,
    duracionMinutos: g.duracionMinutos,
    cupo: g.cupo,
    inscritos: g._count.disciplinas,
    disciplinas: g.disciplinasGrupo.map((gd) => ({
      id: gd.disciplina.id,
      nombre: gd.disciplina.nombre,
      color: gd.disciplina.color,
      horaTexto: gd.horaTexto,
    })),
    tarifa: g.tarifa
      ? {
          id: g.tarifa.id,
          precioMensualidad: g.tarifa.precioMensualidad.toNumber(),
          precioPreseason: g.tarifa.precioPreseason?.toNumber() ?? null,
        }
      : null,
  }));
}

export async function getConfiguracion(
  tx: PrismaTransactionClient,
  claves: string[]
): Promise<Record<string, string>> {
  const configs = await tx.configuracion.findMany({
    where: { clave: { in: claves } },
  });

  return configs.reduce((acc, curr) => {
    acc[curr.clave] = curr.valor;
    return acc;
  }, {} as Record<string, string>);
}
