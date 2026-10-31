import { connection } from 'next/server';
import { discoverMetadata } from '@/lib/discoverMetadata';
import { discoverStart, getPublicSpot } from '@/lib/publicContent';
import { spotListItem } from '@/lib/listItems';
import { browseParamsFrom, browseSpots } from '@/lib/spotBrowse';
import { liveSponsoredId } from '@/lib/sponsored/store';
import SpotsListView from './SpotsListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** A picked province gets its own title and canonical URL ("ที่เที่ยวในเชียงใหม่") */
export const generateMetadata = ({ searchParams }: Props) => discoverMetadata('spots', searchParams);

/** Places sent in the HTML: the first batch on a wide screen. Every place page is also in the sitemap. */
const SERVER_SPOTS = 24;

// Read per request so the first places, the ค้นพบ tab counts and the URL filters are in the server HTML.
// The list is filtered on the server; the browser asks /api/spots/browse for the next ones (lib/spotBrowse.ts).
export default async function SpotsPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const sponsoredId = liveSponsoredId('spots');
  const [initial, initialCounts, sponsored] = await Promise.all([
    browseSpots({ ...browseParamsFrom(get), ids: undefined, near: undefined, openedAt: undefined, limit: SERVER_SPOTS }),
    discoverStart(searchParams),
    sponsoredId ? getPublicSpot(sponsoredId) : null,
  ]);
  // The list comes a batch at a time, so the sponsored place travels on its own (the page puts it in its slot)
  return <SpotsListView initial={initial} openedAt={initial.openedAt} initialCounts={initialCounts} sponsoredSpot={sponsored ? spotListItem(sponsored) : null} />;
}
