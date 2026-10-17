import { connection } from 'next/server';
import { discoverStart, listPublicFairs } from '@/lib/publicContent';
import FairsListView from './FairsListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Read per request so the list, the ค้นพบ tab counts and the URL filters are in the server HTML
export default async function FairsPage({ searchParams }: Props) {
  await connection();
  const [events, initialCounts] = await Promise.all([listPublicFairs(), discoverStart(searchParams)]);
  return <FairsListView initialEvents={events} initialCounts={initialCounts} />;
}
