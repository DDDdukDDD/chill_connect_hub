import { connection } from 'next/server';
import { discoverMetadata } from '@/lib/discoverMetadata';
import { discoverStart, listPublicFairs } from '@/lib/publicContent';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { eventListItem } from '@/lib/listItems';
import { fairCollectionJsonLd, jsonLdHtml } from '@/lib/structuredData';
import { liveSponsoredId } from '@/lib/sponsored/store';
import FairsListView from './FairsListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const LISTED_IN_DATA = 30;

/** A picked province gets its own title and canonical URL ("อีเวนต์ในเชียงใหม่") */
export const generateMetadata = ({ searchParams }: Props) => discoverMetadata('fairs', searchParams);

// Read per request so the list, the ค้นพบ tab counts and the URL filters are in the server HTML
export default async function FairsPage({ searchParams }: Props) {
  await connection();
  const [events, initialCounts] = await Promise.all([listPublicFairs(), discoverStart(searchParams)]);
  // Only what is still to come, as list items: the page's data was most of its weight (past ones load when asked for)
  const live = events.filter((event) => !isEventEnded(event)).map(eventListItem);
  const upcoming = [...live]
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date))
    .slice(0, LISTED_IN_DATA);
  return (
    <>
      {/* The upcoming อีเวนต์ as a list search engines read, soonest first, each linking to its own page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          fairCollectionJsonLd(upcoming, '/events', 'อีเวนต์ งานแฟร์ คอนเสิร์ต งานวิ่ง ทั่วไทย', 'รวมอีเวนต์ที่กำลังจะมาถึง งานแฟร์ เอ็กซ์โป คอนเสิร์ต งานวิ่ง และกีฬา เรียงตามวัน ดูวันจัด สถานที่ และค่าเข้าชม แล้วชวนเพื่อนไปด้วยกัน')
        )}
      />
      <FairsListView initialEvents={live} initialCounts={initialCounts} sponsoredId={liveSponsoredId('events')} />
    </>
  );
}
