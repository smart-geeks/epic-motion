import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardBento from './DashboardBento';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const nombre = session?.user?.nombre ?? session?.user?.name ?? 'Admin';

  return <DashboardBento nombre={nombre} />;
}
