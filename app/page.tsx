import { connection } from 'next/server';
import { listPublicQuests, listUpcomingEvents } from '@/lib/publicContent';
import { liveCampaign } from '@/lib/campaigns/store';
import HomeView from './HomeView';

// Read per request so the visitor landing (meetups, challenges, fairs) is in the server HTML, never a stale build copy
export default async function HomePage() {
  await connection();
  const [events, quests] = await Promise.all([listUpcomingEvents(), listPublicQuests()]);
  return <HomeView initialEvents={events} initialQuests={quests} campaign={liveCampaign({ home: true })} />;
}
