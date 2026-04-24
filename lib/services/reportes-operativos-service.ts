import type { PrismaTransactionClient } from '@/lib/prisma-rls';

export interface MetricasOperativas {
  alumnas: {
    activas: number;
    inactivas: number;
    nuevasEsteMes: number;
    distribucionDisciplinas: { nombre: string; cantidad: number }[];
  };
  staff: {
    nominaProyectada: number;
    puntualidadPromedio: number;
    totalSesiones: number;
  };
}

export async function getReportesOperativos(tx: PrismaTransactionClient, mesConsulta?: Date): Promise<MetricasOperativas> {
  const fecha = mesConsulta || new Date();
  const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Alumnas
  const [activas, inactivas, nuevasEsteMes] = await Promise.all([
    tx.alumna.count({ where: { estatus: 'ACTIVA' } }),
    tx.alumna.count({ where: { estatus: 'INACTIVA' } }),
    tx.alumna.count({ where: { fechaInscripcion: { gte: inicioMes, lte: finMes } } })
  ]);

  // Distribución por disciplina
  const disciplinasDB = await tx.alumnaDisciplina.groupBy({
    by: ['disciplinaId'],
    _count: { alumnaId: true }
  });

  const disciplinasData = await tx.disciplina.findMany({
    where: { id: { in: disciplinasDB.map(d => d.disciplinaId) } },
    select: { id: true, nombre: true }
  });

  const distribucionDisciplinas = disciplinasDB.map(d => ({
    nombre: disciplinasData.find(x => x.id === d.disciplinaId)?.nombre || 'Desconocida',
    cantidad: d._count.alumnaId
  })).sort((a, b) => b.cantidad - a.cantidad);

  // 2. Staff (Nómina y Puntualidad)
  // Obtenemos todos los profesores y sus sesiones/clases privadas del mes de una vez
  const profesores = await tx.profesor.findMany({
    select: { 
      id: true, 
      tarifaHora: true, 
      usuarioId: true,
      clasesPrivadas: {
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          estado: 'COMPLETADA'
        }
      }
    }
  });

  // Obtenemos todas las sesiones del mes
  const todasLasSesiones = await tx.sesion.findMany({
    where: {
      fecha: { gte: inicioMes, lte: finMes },
      estado: { in: ['COMPLETADA', 'INICIADA', 'PROGRAMADA'] }
    }
  });

  let nominaProyectada = 0;
  let puntualidadTotal = 0;
  let sesionesConCheckin = 0;
  let totalSesiones = todasLasSesiones.length;

  for (const prof of profesores) {
    const tarifa = Number(prof.tarifaHora || 0);

    // Filtrar sesiones de este profesor (usando usuarioId)
    const sesionesProf = todasLasSesiones.filter(s => s.profesorId === prof.usuarioId);
    
    for (const sesion of sesionesProf) {
      const duracionMs = sesion.horaFin.getTime() - sesion.horaInicio.getTime();
      const horas = Math.max(0, duracionMs / (1000 * 60 * 60));
      nominaProyectada += horas * tarifa;

      if (sesion.checkinAt) {
        sesionesConCheckin++;
        const diffMinutos = (sesion.checkinAt.getTime() - sesion.horaInicio.getTime()) / (1000 * 60);
        
        if (diffMinutos <= 0) {
          puntualidadTotal += 100;
        } else if (diffMinutos <= 15) {
          puntualidadTotal += 100 - (diffMinutos * (100 / 15));
        }
      }
    }

    // Clases privadas (ya vienen incluidas en el fetch de profesores)
    for (const cp of prof.clasesPrivadas) {
      nominaProyectada += (cp.duracion / 60) * tarifa;
    }
  }

  const puntualidadPromedio = sesionesConCheckin > 0 ? (puntualidadTotal / sesionesConCheckin) : 100;

  return {
    alumnas: {
      activas,
      inactivas,
      nuevasEsteMes,
      distribucionDisciplinas
    },
    staff: {
      nominaProyectada,
      puntualidadPromedio,
      totalSesiones
    }
  };
}
