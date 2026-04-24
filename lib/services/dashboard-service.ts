import type { PrismaTransactionClient } from '@/lib/prisma-rls';

/**
 * Retorna el inicio del día (00:00:00) para una fecha dada.
 */
function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna el fin del día (23:59:59) para una fecha dada.
 */
function getEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Formatea una fecha a HH:mm (24h)
 */
function formatTime(date: Date) {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export async function getDashboardMetrics(tx: PrismaTransactionClient) {
  const hoy = new Date();
  
  // 1. Total Alumnas Activas
  const totalAlumnas = await tx.alumna.count({
    where: { estatus: 'ACTIVA' }
  });

  // 2. Clases Hoy
  const daysMap: Record<number, string> = {
    0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S'
  };
  const diaHoy = daysMap[hoy.getDay()];

  const clasesHoy = await tx.clase.count({
    where: {
      dias: { has: diaHoy }
    }
  });

  // 3. Pagos Pendientes (Cargos)
  const pagosPendientes = await tx.cargo.count({
    where: { estado: 'PENDIENTE' }
  });

  // 4. Maestros en plantilla
  const maestrosActivos = await tx.usuario.count({
    where: {
      rol: 'MAESTRO',
      activo: true
    }
  });

  // 5. Asistencia de hoy
  const asistenciasHoy = await tx.asistencia.count({
    where: {
      createdAt: {
        gte: getStartOfDay(hoy),
        lte: getEndOfDay(hoy)
      }
    }
  });

  // 6. Alertas de Check-in
  const alertasCheckin = await tx.sesion.findMany({
    where: {
      fecha: {
        gte: getStartOfDay(hoy),
        lte: getEndOfDay(hoy)
      },
      estado: 'PROGRAMADA'
    },
    include: {
      clase: true,
      profesor: true
    }
  });

  const clasesRetrasadas = alertasCheckin.filter(s => s.horaInicio < hoy);

  return {
    totalAlumnas,
    clasesHoy,
    pagosPendientes,
    maestrosActivos,
    asistenciasHoy,
    clasesRetrasadas: clasesRetrasadas.map(s => ({
      id: s.id,
      clase: s.clase.nombre,
      maestro: s.profesor.nombre,
      horaInicio: formatTime(s.horaInicio),
    }))
  };
}
