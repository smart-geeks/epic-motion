import type { PrismaTransactionClient } from '@/lib/prisma-rls';
import type { TipoTierGrupo, CategoriaGrupo } from '@/app/generated/prisma/client';

export function calcularEdadCiclo(fechaNacimiento: Date): number {
  const ahora = new Date();
  const yearRef = ahora.getMonth() >= 7 ? ahora.getFullYear() : ahora.getFullYear() - 1;
  const agosto = new Date(yearRef, 7, 1);
  let edad = agosto.getFullYear() - fechaNacimiento.getFullYear();
  const dm = agosto.getMonth() - fechaNacimiento.getMonth();
  if (dm < 0 || (dm === 0 && agosto.getDate() < fechaNacimiento.getDate())) edad--;
  return edad;
}

export function buildHoraTexto(dias: string[], horaInicio: string, duracionMinutos: number): string {
  if (!dias.length || !horaInicio) return '';
  const DIA_LARGO: Record<string, string> = {
    L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom',
  };
  const [h, m] = horaInicio.split(':').map(Number);
  const finTotal = h * 60 + m + duracionMinutos;
  const horaFin = `${String(Math.floor(finTotal / 60)).padStart(2, '0')}:${String(finTotal % 60).padStart(2, '0')}`;
  const labels = dias.map((d) => DIA_LARGO[d]).filter(Boolean);
  const diaStr =
    labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} y ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`;
  return `${diaStr} ${horaInicio}–${horaFin}`;
}

export async function getDisciplinas(tx: PrismaTransactionClient): Promise<any[]> {
  return tx.disciplina.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, color: true },
    orderBy: { nombre: 'asc' },
  });
}

export async function getProfesores(tx: PrismaTransactionClient): Promise<any[]> {
  return tx.usuario.findMany({
    where: { rol: 'MAESTRO', activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ nombre: 'asc' }],
  });
}
