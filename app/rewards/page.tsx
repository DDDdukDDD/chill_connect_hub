import { connection } from 'next/server';
import { homeCampaigns } from '@/lib/campaigns/store';
import { listRewards } from '@/lib/rewards/catalog';
import RewardsView from './RewardsView';

// Read per request, as on /challenges: a campaign shows and goes by its dates
export default async function RewardsPage() {
  await connection();
  const [campaigns, catalog] = await Promise.all([homeCampaigns(), listRewards()]);
  return <RewardsView campaigns={campaigns} catalog={catalog} />;
}
