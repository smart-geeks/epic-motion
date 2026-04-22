import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { getReportesFinancieros } from '@/lib/services/reportes-financieros-service';
import { getReportesOperativos } from '@/lib/services/reportes-operativos-service';
import ReportesDashboardClient from './ReportesDashboardClient';

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { dataFinanzas, dataOperativa } = await withRLS(session, async (tx) => {
    const finanzas = await getReportesFinancieros(tx);
    const operativa = await getReportesOperativos(tx);
    return { dataFinanzas: finanzas, dataOperativa: operativa };
  });

  return (
    <ReportesDashboardClient dataFinanzas={dataFinanzas} dataOperativa={dataOperativa} />
  );
}
