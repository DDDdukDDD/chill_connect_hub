import { connection } from 'next/server';
import { listPublicQuests } from '@/lib/publicContent';
import { liveCampaign } from '@/lib/campaigns/store';
import ChallengesListView from './ChallengesListView';

type Props = { searchParams: Promise<{ q?: string }> };

// Read per request so the challenges are in the server HTML, never a stale build copy.
// ?q= comes from the ค้นพบ search ("ชาเลนจ์ที่ตรงกับ…").
export default async function ChallengesPage({ searchParams }: Props) {
  await connection();
  const { q } = await searchParams;
  return <ChallengesListView initialQuests={await listPublicQuests()} initialQuery={typeof q === 'string' ? q : ''} campaign={liveCampaign()} />;
}
