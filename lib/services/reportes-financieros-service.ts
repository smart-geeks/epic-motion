import type { PrismaTransactionClient } from '@/lib/prisma-rls';

export interface MetricasFinancieras {
  ingresosProyectados: number;
  ingresosReales: number;
  morosidadTotal: number;
  porcentajeCobranza: number;
  ingresosPorCategoria: {
    categoria: string;
    monto: number;
  }[];
  tendenciaMeses: {
    mes: string;
    ingreso: number;
    proyectado: number;
  }[];
}

export async function getReportesFinancieros(tx: PrismaTransactionClient, mesConsulta?: Date): Promise<MetricasFinancieras> {
  const fecha = mesConsulta || new Date();
  
  // Rango del mes actual
  const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Ingresos Proyectados (Total de Cargos con fechaVencimiento en este mes, sin importar si se pagaron)
  const cargosMes = await tx.cargo.findMany({
    where: {
      fechaVencimiento: {
        gte: inicioMes,
        lte: finMes,
      },
      estado: {
        not: 'CANCELADO'
      }
    },
    select: {
      montoFinal: true,
      concepto: {
        select: {
          tipo: true
        }
      }
    }
  });

  const ingresosProyectados = cargosMes.reduce((acc, cargo) => acc + Number(cargo.montoFinal), 0);

  // 2. Ingresos Reales (Total de Pagos con fechaPago en este mes, estado PAGADO)
  const pagosReales = await tx.pago.findMany({
    where: {
      fechaPago: {
        gte: inicioMes,
        lte: finMes,
      },
      estado: 'PAGADO'
    },
    select: {
      importe: true,
      tipo: true
    }
  });

  const ingresosReales = pagosReales.reduce((acc, pago) => acc + Number(pago.importe), 0);

  // 3. Morosidad Total (Total de Cargos PENDIENTE o VENCIDO de todos los tiempos hasta fin de mes)
  const cargosMorosos = await tx.cargo.findMany({
    where: {
      fechaVencimiento: {
        lte: finMes,
      },
      estado: {
        in: ['PENDIENTE', 'VENCIDO']
      }
    },
    select: {
      montoFinal: true,
      aplicaciones: {
        select: {
          montoAplicado: true
        }
      }
    }
  });

  let morosidadTotal = 0;
  cargosMorosos.forEach(cargo => {
    const pagado = cargo.aplicaciones.reduce((acc, app) => acc + Number(app.montoAplicado), 0);
    morosidadTotal += (Number(cargo.montoFinal) - pagado);
  });

  // 4. Porcentaje de Cobranza (Ingresos Reales vs Ingresos Proyectados del mes actual)
  let porcentajeCobranza = 0;
  if (ingresosProyectados > 0) {
    // Es posible que ingresosReales sea mayor a ingresosProyectados si pagaron cosas atrasadas en este mes.
    // Usaremos lo que se pagó DE LOS CARGOS de este mes para un % más preciso, o simplemente Reales / Proyectados.
    // Para simplificar, Reales / Proyectados.
    porcentajeCobranza = (ingresosReales / ingresosProyectados) * 100;
  }

  // 5. Ingresos por Categoría (Basado en los Pagos Reales)
  const categoriaMap: Record<string, number> = {};
  pagosReales.forEach(pago => {
    const cat = pago.tipo;
    if (!categoriaMap[cat]) categoriaMap[cat] = 0;
    categoriaMap[cat] += Number(pago.importe);
  });

  const ingresosPorCategoria = Object.keys(categoriaMap).map(key => ({
    categoria: key,
    monto: categoriaMap[key]
  })).sort((a, b) => b.monto - a.monto);

  // 6. Tendencia 6 Meses (Gráfico)
  // Calcularemos los ingresos y proyectados de los últimos 6 meses (incluyendo el actual)
  const tendenciaMeses = [];
  const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 5; i >= 0; i--) {
    const targetMonth = new Date(fecha.getFullYear(), fecha.getMonth() - i, 1);
    const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const proj = await tx.cargo.aggregate({
      where: {
        fechaVencimiento: { gte: start, lte: end },
        estado: { not: 'CANCELADO' }
      },
      _sum: {
        montoFinal: true
      }
    });

    const real = await tx.pago.aggregate({
      where: {
        fechaPago: { gte: start, lte: end },
        estado: 'PAGADO'
      },
      _sum: {
        importe: true
      }
    });

    tendenciaMeses.push({
      mes: `${nombresMeses[targetMonth.getMonth()]} ${targetMonth.getFullYear().toString().substring(2)}`,
      proyectado: Number(proj._sum.montoFinal || 0),
      ingreso: Number(real._sum.importe || 0)
    });
  }

  return {
    ingresosProyectados,
    ingresosReales,
    morosidadTotal,
    porcentajeCobranza,
    ingresosPorCategoria,
    tendenciaMeses
  };
}
