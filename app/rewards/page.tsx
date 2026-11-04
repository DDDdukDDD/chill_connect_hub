import { connection } from 'next/server';
import { homeCampaigns } from '@/lib/campaigns/store';
import RewardsView from './RewardsView';

// Read per request, as on /challenges: a campaign shows and goes by its dates
export default async function RewardsPage() {
  await connection();
  return <RewardsView campaigns={await homeCampaigns()} />;
}
