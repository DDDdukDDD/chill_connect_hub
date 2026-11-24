// Puts the official facts on the Amazing Thailand Marathon Bangkok 2026 อีเวนต์ (live-agg-30), checked against
// amazingthailandmarathon.com on 2026-11-24. The seed copy had the marathon only (Sunday 02:00, Sanam Luang), the
// registration site as organiser, a 10K price and made-up stars, reviews and a "ยอดนิยม" badge.
//
//   node db/fix-atmbkk.mjs            show the change, touch nothing
//   node db/fix-atmbkk.mjs --apply    write it
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
// The row mapping is the app's own (lib/db/postgres/rows.mjs).
import { adminConnection } from './env.mjs';
import { eventToRow, rowToEvent } from '../lib/db/postgres/rows.mjs';

const SLUG = 'live-agg-30';
const OFFICIAL = 'https://amazingthailandmarathon.com/';
const apply = process.argv.includes('--apply');

const FACTS = {
  title: 'Amazing Thailand Marathon Bangkok 2026 (ATMBKK 2026)',
  description: [
    'มาราธอนกลางกรุงเทพฯ ระดับ World Athletics Elite Label ปิดถนนวิ่งผ่านเมืองเก่า จัดสองวัน มี 4 ระยะ',
    '',
    '• ฮาล์ฟมาราธอน 21.1 กม.: เสาร์ 28 พ.ย. 2569 ปล่อยตัว 04:00 น. ที่ MBK Center ถนนพญาไท เข้าเส้นชัยสนามหลวง ตัดเวลา 08:00 น.',
    '• มาราธอน 42.195 กม.: อาทิตย์ 29 พ.ย. 2569 ปล่อยตัว 02:00 น. ที่สนามหลวง (หน้าศาลฎีกา) ตัดเวลา 09:30 น.',
    '• 10 กม.: อาทิตย์ 29 พ.ย. 2569 ปล่อยตัว 06:00 น. ที่สนามหลวง ตัดเวลา 08:30 น.',
    '• Family Run 4.5 กม. (เดิน-วิ่ง ไม่จัดอันดับ): อาทิตย์ 29 พ.ย. 2569 07:00 น. ที่สนามหลวง',
    '',
    'จัดโดยคณะกรรมการจัดงาน ATMBOC ร่วมกับการกีฬาแห่งประเทศไทย ททท. และกรุงเทพมหานคร รับสมัครถึง 31 ต.ค. 2569 เวลาและเส้นทางล่าสุดดูที่เว็บทางการ',
  ].join('\n'),
  // Saturday 04:00 (half marathon start) to Sunday 09:30 (marathon cut-off)
  date: '28 พ.ย. 2026',
  endDate: '29 พ.ย. 2026',
  time: '04:00 - 09:30 น.',
  location: 'สนามหลวง และ MBK Center (จุดปล่อยตัวฮาล์ฟมาราธอน)',
  province: 'กรุงเทพมหานคร',
  latitude: 13.7553,
  longitude: 100.493,
  hostName: 'คณะกรรมการจัดงาน ATMBOC (การกีฬาแห่งประเทศไทย)',
  price: '฿600 - 1,800',
  fairCategory: 'marathon_sports',
  externalUrl: OFFICIAL,
  link: OFFICIAL,
  source: 'เว็บไซต์ทางการ Amazing Thailand Marathon',
  sourceUrl: OFFICIAL,
  registrationOpen: false,
};
/** Seed-only fields that described nothing real */
const MADE_UP = ['rating', 'reviewsCount', 'badgeText', 'isNew', 'maxParticipants'];

const sql = adminConnection();
try {
  const [row] = await sql`select * from app.events where slug = ${SLUG}`;
  if (!row) throw new Error(`no event ${SLUG}`);
  const [provinces, venues] = await Promise.all([sql`select code from app.provinces`, sql`select code from app.venues`]);
  const before = rowToEvent(row);
  const event = { ...before, ...FACTS };
  for (const key of MADE_UP) delete event[key];
  const next = eventToRow(event, {
    provinceCodes: new Set(provinces.map((p) => p.code)),
    venueCodes: new Set(venues.map((v) => v.code)),
    id: row.id,
    hostId: row.host_member_id,
    placeId: row.place_id,
    seriesId: row.series_id,
    participantsCount: row.participants_count,
    sortKey: Number(row.sort_key),
    isSample: false,
  });
  // Kept as they are: identity, order, creation time, moderation
  for (const key of ['id', 'slug', 'sort_key', 'created_at', 'moderated_at']) delete next[key];
  next.approval_status = row.approval_status;

  const changed = Object.keys(next).filter((key) => JSON.stringify(next[key]) !== JSON.stringify(row[key]));
  console.log(`${SLUG}: ${changed.length} columns change`);
  for (const key of changed) {
    const show = (v) => (typeof v === 'string' ? v : JSON.stringify(v))?.slice(0, 160);
    console.log(`  ${key}:\n    was ${show(row[key])}\n    now ${show(next[key])}`);
  }
  if (!apply) {
    console.log('Nothing changed (add --apply).');
  } else {
    await sql`update app.events set ${sql(next, changed)}, updated_at = now() where id = ${row.id}`;
    console.log('Done.');
  }
} finally {
  await sql.end();
}
