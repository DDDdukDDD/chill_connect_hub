import { connection } from 'next/server';
import { discoverMetadata } from '@/lib/discoverMetadata';
import { discoverStart, listPublicMeetups } from '@/lib/publicContent';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { jsonLdHtml, meetupCollectionJsonLd } from '@/lib/structuredData';
import CommunityListView from './CommunityListView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const LISTED_IN_DATA = 30;

/** A picked province gets its own title and canonical URL ("ตี้ในเชียงใหม่") */
export const generateMetadata = ({ searchParams }: Props) => discoverMetadata('meetups', searchParams);

// Read per request so the list, the ค้นพบ tab counts and the ?q= / ?province= filters are in the server HTML
export default async function CommunityPage({ searchParams }: Props) {
  await connection();
  const [events, initialCounts] = await Promise.all([listPublicMeetups(), discoverStart(searchParams)]);
  const upcoming = events
    .filter((event) => (event.eventType || 'community') === 'community' && !isEventEnded(event))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date))
    .slice(0, LISTED_IN_DATA);
  return (
    <>
      {/* The upcoming ตี้ as a list search engines read, soonest first, each linking to its own page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          meetupCollectionJsonLd(upcoming, '/community', 'ตี้หาเพื่อนไปทำกิจกรรมด้วยกัน', 'รวมตี้ที่เปิดรับอยู่ วิ่ง คาเฟ่ บอร์ดเกม เวิร์กช็อป ฮีลใจ และอีกมาก เลือกตามสายที่ชอบ แล้วไปเจอเพื่อนใหม่ที่งานจริง')
        )}
      />
      <CommunityListView initialEvents={events} initialCounts={initialCounts} />
    </>
  );
}
