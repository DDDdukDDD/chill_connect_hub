import { connection } from 'next/server';
import { pageMetadata } from '@/lib/site';
import { eventListItem } from '@/lib/listItems';
import { jsonLdHtml, meetupCollectionJsonLd } from '@/lib/structuredData';
import { weekContent, weekLabel } from '@/lib/thisWeek';
import ThisWeekView from './ThisWeekView';

export const metadata = pageMetadata({
  title: 'สัปดาห์นี้ไปไหนดี',
  description: 'ตี้ที่ยังมีที่ว่างและอีเวนต์ 7 วันข้างหน้า เรียงตามวัน พร้อมชาเลนจ์ไว้ทำวันว่าง เลือกวันที่ว่างแล้วชวนเพื่อนออกไปใช้ชีวิตกัน',
  path: '/this-week',
});

// The first view of กิจกรรม (owner 2026-11-19). Read per request: the days move with the date, and the schedule is in
// the server HTML for search and AI crawlers (AGENTS.md 4)
export default async function ThisWeekPage() {
  await connection();
  const content = await weekContent();
  const byDay = Object.fromEntries(Object.entries(content.byDay).map(([iso, items]) => [iso, items.map((item) => ({ kind: item.kind, event: eventListItem(item.event) }))]));
  const tees = content.days.flatMap((day) => byDay[day.iso].filter((item) => item.kind === 'tee').map((item) => item.event));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(meetupCollectionJsonLd(tees.slice(0, 30), '/this-week', 'ตี้สัปดาห์นี้', 'ตี้ที่ยังมีที่ว่าง 7 วันข้างหน้า'))}
      />
      <ThisWeekView
        days={content.days}
        label={weekLabel(content.days)}
        byDay={byDay}
        ongoing={content.ongoing.map(eventListItem)}
        // Every open challenge for the two challenge rows; the tiles show no description, so it stays on the server
        quests={content.quests.map((quest) => ({ ...quest, description: '' }))}
        places={content.places}
      />
    </>
  );
}
