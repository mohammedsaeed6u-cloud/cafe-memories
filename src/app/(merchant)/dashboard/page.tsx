import { requirePageIdentity } from '@/lib/server/page-auth';
import MerchantDashboardPage from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requirePageIdentity();
  return <MerchantDashboardPage />;
}
