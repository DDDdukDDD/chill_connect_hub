import { connection } from 'next/server';
import { discoverStart, listTopSpots } from '@/lib/publicContent';
import SpotsListView from './SpotsListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Places sent in the HTML: the first pages of the list. Every place page is also in the sitemap. */
const SERVER_SPOTS = 60;

// Read per request so the first places, the ค้นพบ tab counts and the URL filters are in the server HTML
export default async function SpotsPage({ searchParams }: Props) {
  await connection();
  const [spots, initialCounts] = await Promise.all([listTopSpots(SERVER_SPOTS), discoverStart(searchParams)]);
  return <SpotsListView initialSpots={spots} initialCounts={initialCounts} />;
}
