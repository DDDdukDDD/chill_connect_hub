import { connection } from 'next/server';
import { discoverStart, listPublicMeetups } from '@/lib/publicContent';
import CommunityListView from './CommunityListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Read per request so the list, the ค้นพบ tab counts and the ?q= / ?province= filters are in the server HTML
export default async function CommunityPage({ searchParams }: Props) {
  await connection();
  const [events, initialCounts] = await Promise.all([listPublicMeetups(), discoverStart(searchParams)]);
  return <CommunityListView initialEvents={events} initialCounts={initialCounts} />;
}
