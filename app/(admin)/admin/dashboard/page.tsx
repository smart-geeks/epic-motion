import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import * as svc from '@/lib/services/inscripcion-service';
import { getDashboardMetrics } from '@/lib/services/dashboard-service';
import DashboardBento from './DashboardBento';

async function obtenerDatosDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return await withRLS(session, async (tx) => {
    const inscripcion = {
      grupos: await svc.getGruposParaInscripcion(tx),
      config: await svc.getConfiguracion(tx, ['cuota_inscripcion']),
      cicloEscolar: svc.calcularCicloEscolar(),
    };

    const metrics = await getDashboardMetrics(tx);

    return {
      datosInscripcion: {
        grupos: inscripcion.grupos,
        cuotaInscripcion: parseFloat(inscripcion.config.cuota_inscripcion ?? '0'),
        cicloEscolar: inscripcion.cicloEscolar,
      },
      metrics
    };
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const nombre = session?.user?.nombre ?? session?.user?.name ?? 'Admin';
  
  const data = await obtenerDatosDashboard();

  if (!data) return null;

  return (
    <DashboardBento 
      nombre={nombre} 
      datosInscripcion={data.datosInscripcion} 
      metrics={data.metrics}
    />
  );
}
