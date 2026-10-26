import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listPublicQuests, listUpcomingEvents } from '@/lib/publicContent';
import { liveCampaign } from '@/lib/campaigns/store';
import HomeView from './HomeView';

// The home page's own address: invite and share links (/?invite=…, /?share=…) point search engines here
export const metadata: Metadata = { alternates: { canonical: '/' } };

// Read per request so the visitor landing (meetups, challenges, fairs) is in the server HTML, never a stale build copy
export default async function HomePage() {
  await connection();
  const [events, quests] = await Promise.all([listUpcomingEvents(), listPublicQuests()]);
  return <HomeView initialEvents={events} initialQuests={quests} campaign={liveCampaign({ home: true })} />;
}
