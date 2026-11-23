/**
 * Content audit (owner 2026-11-21: the week of 23 Nov is 80% data). READS ONLY: it calls the app's own find/list
 * methods and never writes, so it is safe on the live database too.
 *
 *   npx tsx --env-file=.env.development.local db/audit-content.ts [--out=audit-dev.md] [--json=audit-dev.json]
 *   live (Git Bash; .env.local has no DATA_STORE or DATABASE_URL, so pass the direct connection; this script only reads):
 *   DATA_STORE=postgres DATABASE_URL="$(grep ^POSTGRES_URL_NON_POOLING= .env.local | cut -d= -f2- | tr -d '"\r')" \
 *     npx tsx db/audit-content.ts --out=audit-live.md --json=audit-live.json
 *   npx tsx db/audit-content.ts                      no database: the JSON files in data/
 *   npx tsx db/audit-content.ts --diff=audit-dev.json,audit-live.json
 *                                                    what the first has that the second does not (TAT places on dev)
 *
 * The report says, per province and in all:
 * - how many open ตี้ and อีเวนต์ start in the next 7 and 30 days, real ones apart from sample data (lib/contentOrigin.ts);
 * - places: published, with a photo, with a description and a vibe line, drafts waiting (by source);
 * - challenges open now;
 * - problems to fix: missing province, place, time or organizer; past events not marked ended; titles and
 *   descriptions under the form's minimum; likely duplicates; published places without a photo or hours; pictures that
 *   point at files missing from public/.
 * Report files hold titles and ids only, no member data. Keep them out of git (they go stale in a day).
 */
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db';
import { USE_POSTGRES } from '@/lib/db/postgres/client';
import { eventOrigin, spotOrigin, type ContentOrigin } from '@/lib/contentOrigin';
import { isClosedToJoin, isEventEndedByDate, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';

const DEV_REF = 'womkobbjdlzefyrxspxh';
const DAY_MS = 24 * 60 * 60 * 1000;
/** How many examples each problem lists */
const EXAMPLES = 8;
/** The form's minimums (AGENTS.md 3) */
const MIN_TITLE = 5;
const MIN_DESCRIPTION = 15;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

type Snapshot = {
  database: string;
  at: string;
  events: { id: string; title: string; province: string; date: string; kind: 'tee' | 'fair'; origin: ContentOrigin; source?: string; sourceUrl?: string; approval?: string }[];
  spots: { id: string; title: string; province: string; status: string; origin: ContentOrigin; source?: string; sourceUrl?: string; hasImage: boolean }[];
};

/* ---------- helpers ---------- */

const provinceOf = (name?: string) => {
  const p = (name || '').trim();
  if (!p) return '(ไม่ระบุ)';
  return p === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : p;
};
/** Text outside HTML tags, only for measuring length (never rendered). A scan, not a regex, so nothing half-stripped is left. */
const textOutsideTags = (html: string) => {
  let out = '';
  let inTag = false;
  for (const ch of html) {
    if (ch === '<') inTag = true;
    else if (ch === '>') inTag = false;
    else if (!inTag) out += ch;
  }
  return out;
};
const norm = (text: string) => text.toLowerCase().replace(/[\s\-–—_.,:;!?'"()[\]]+/g, '');
/** "คัดโดย Chillwaa · พิกัด … · รูป …" groups as "คัดโดย Chillwaa": the photo credit is per place */
const sourceGroup = (source?: string) => source?.split(' · ')[0].trim() || '(ไม่ระบุแหล่ง)';
const hasImage = (url?: string) => Boolean(url && url.trim() && !/placeholder|default/i.test(url));
/** A local picture (/images/...) whose file is not in public/ */
const missingLocal = (url?: string) => Boolean(url && url.startsWith('/') && !url.startsWith('//') && !fs.existsSync(path.join(process.cwd(), 'public', decodeURI(url.split('?')[0]))));
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const examples = (items: string[]) => (items.length ? items.slice(0, EXAMPLES).map((t) => `  - ${t}`).join('\n') + (items.length > EXAMPLES ? `\n  - … และอีก ${items.length - EXAMPLES}` : '') : '');

function whichDatabase(): string {
  if (!USE_POSTGRES) return 'ไม่มีฐานข้อมูล (data/*.json)';
  try {
    const ref = decodeURIComponent(new URL(process.env.DATABASE_URL || '').username).split('.')[1] || '?';
    return ref === DEV_REF ? `dev (${ref})` : `LIVE (${ref}) อ่านอย่างเดียว`;
  } catch {
    return 'Postgres (อ่านชื่อโปรเจกต์ไม่ได้)';
  }
}

async function allSpots(): Promise<LifestyleSpotItem[]> {
  const out: LifestyleSpotItem[] = [];
  for (let page = 1; ; page++) {
    const res = await db.findSpots({ page, limit: 500, includeDrafts: true });
    out.push(...res.items);
    if (!res.hasNextPage || res.items.length === 0) return out;
  }
}

async function allQuests(): Promise<ChallengeQuest[]> {
  const out: ChallengeQuest[] = [];
  for (let page = 1; ; page++) {
    const res = await db.findQuests({ page, limit: 100, status: 'all', includeDrafts: true });
    out.push(...res.items);
    if (!res.hasNextPage || res.items.length === 0) return out;
  }
}

/* ---------- the audit ---------- */

async function audit() {
  const now = Date.now();
  const [events, spots, quests] = await Promise.all([db.listAllEvents(), allSpots(), allQuests()]);
  const lines: string[] = [];
  const say = (text = '') => lines.push(text);
  const database = whichDatabase();

  say(`# ตรวจข้อมูล Chillwaa`);
  say();
  say(`ฐานข้อมูล: **${database}** · เวลา ${new Date(now).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
  say();

  /* Totals */
  const kindOf = (e: EventItem) => ((e.eventType || 'community') === 'community' ? 'tee' : 'fair') as 'tee' | 'fair';
  const originCount = <T,>(items: T[], origin: (item: T) => ContentOrigin) => {
    const counts = { member: 0, source: 0, sample: 0 };
    for (const item of items) counts[origin(item)]++;
    return counts;
  };
  const tees = events.filter((e) => kindOf(e) === 'tee' && !e.seriesId);
  const fairs = events.filter((e) => kindOf(e) === 'fair');
  const teeOrigins = originCount(tees, eventOrigin);
  const fairOrigins = originCount(fairs, eventOrigin);
  const spotOrigins = originCount(spots, spotOrigin);
  say(`## ภาพรวม`);
  say();
  say(
    table(
      ['', 'ทั้งหมด', 'สมาชิกสร้าง', 'จากแหล่งข้อมูล', 'ตัวอย่าง'],
      [
        ['ตี้', tees.length, teeOrigins.member, teeOrigins.source, teeOrigins.sample],
        ['อีเวนต์', fairs.length, fairOrigins.member, fairOrigins.source, fairOrigins.sample],
        ['ที่เที่ยว', spots.length, spotOrigins.member, spotOrigins.source, spotOrigins.sample],
        ['ชาเลนจ์', quests.length, quests.filter((q) => q.createdByMemberId).length, '-', '-'],
      ],
    ),
  );
  say();

  /* Upcoming per province */
  const approved = (e: EventItem) => !e.approvalStatus || e.approvalStatus === 'approved';
  const startsWithin = (e: EventItem, days: number) => {
    const start = parseEventDateToTimestamp(e.date);
    return Number.isFinite(start) && start >= now - DAY_MS && start <= now + days * DAY_MS;
  };
  const openTee = (e: EventItem) => kindOf(e) === 'tee' && approved(e) && !isClosedToJoin(e);
  const liveFair = (e: EventItem) => kindOf(e) === 'fair' && approved(e) && !isEventEndedByDate(e.endDate || e.date);
  type Row = { tee7: number; tee30: number; fair7: number; fair30: number; sample7: number; spots: number; spotsReady: number };
  const byProvince = new Map<string, Row>();
  const row = (p: string) => byProvince.get(p) ?? (byProvince.set(p, { tee7: 0, tee30: 0, fair7: 0, fair30: 0, sample7: 0, spots: 0, spotsReady: 0 }), byProvince.get(p)!);
  for (const e of events) {
    if (!(openTee(e) || liveFair(e))) continue;
    const r = row(provinceOf(e.province));
    const sample = eventOrigin(e) === 'sample';
    if (startsWithin(e, 7)) {
      if (sample) r.sample7++;
      else if (kindOf(e) === 'tee') r.tee7++;
      else r.fair7++;
    }
    if (!sample && startsWithin(e, 30)) {
      if (kindOf(e) === 'tee') r.tee30++;
      else r.fair30++;
    }
  }
  const published = spots.filter((s) => s.publicationStatus !== 'draft' && !s.chainBrand);
  for (const s of published) {
    const r = row(provinceOf(s.province));
    r.spots++;
    if (hasImage(s.image) && (s.description || '').trim().length >= MIN_DESCRIPTION) r.spotsReady++;
  }
  const provinces = [...byProvince.entries()].sort((a, b) => b[1].tee30 + b[1].fair30 - (a[1].tee30 + a[1].fair30) || b[1].spots - a[1].spots);
  const withEvents = provinces.filter(([, r]) => r.tee30 + r.fair30 + r.sample7 > 0);
  const placesOnly = provinces.filter(([p, r]) => r.tee30 + r.fair30 + r.sample7 === 0 && r.spots > 0 && p !== '(ไม่ระบุ)');
  say(`## แยกตามจังหวัด (ของจริง ไม่นับข้อมูลตัวอย่าง)`);
  say();
  say('ตี้ที่ยังเปิดรับและอีเวนต์ที่ยังไม่จบ นับจากวันเริ่ม · "ที่เที่ยวพร้อม" = เผยแพร่แล้ว มีรูปและคำอธิบาย · "บาง" = 7 วันข้างหน้ามีไม่ถึง 6 อย่าง (หน้าสัปดาห์นี้จะเข้าโหมดของน้อย)');
  say();
  say(
    table(
      ['จังหวัด', 'ตี้ 7 วัน', 'อีเวนต์ 7 วัน', 'ตี้ 30 วัน', 'อีเวนต์ 30 วัน', 'ตัวอย่าง 7 วัน', 'ที่เที่ยว', 'ที่เที่ยวพร้อม', ''],
      withEvents.map(([p, r]) => [p, r.tee7, r.fair7, r.tee30, r.fair30, r.sample7, r.spots, r.spotsReady, r.tee7 + r.fair7 < 6 ? 'บาง' : '']),
    ),
  );
  say();
  // Provinces as the site knows them: the 77, not "ออนไลน์" or a missing province
  const real = (p: string) => p !== '(ไม่ระบุ)' && p !== 'ออนไลน์';
  const known = new Set(provinces.map(([p]) => p).filter(real));
  const full = withEvents.filter(([p, r]) => real(p) && r.tee7 + r.fair7 >= 6).length;
  say(`มีตี้หรืออีเวนต์ใน 30 วัน ${withEvents.filter(([p]) => real(p)).length} จังหวัด · 7 วันข้างหน้าไม่บาง ${full} จังหวัด · มีแค่ที่เที่ยว ${placesOnly.length} จังหวัด · ไม่มีอะไรเลย ${Math.max(0, 77 - known.size)} จังหวัด`);
  say();
  if (placesOnly.length) {
    say(`มีแค่ที่เที่ยว: ${placesOnly.map(([p, r]) => `${p} ${r.spots}`).join(' · ')}`);
    say();
  }

  /* Places */
  const drafts = spots.filter((s) => s.publicationStatus === 'draft' && !s.reviewRejectedAt);
  const draftBySource = new Map<string, number>();
  for (const s of drafts) draftBySource.set(sourceGroup(s.sourceName), (draftBySource.get(sourceGroup(s.sourceName)) ?? 0) + 1);
  say(`## ที่เที่ยว`);
  say();
  say(
    table(
      ['', 'จำนวน'],
      [
        ['เผยแพร่แล้ว (ไม่นับสาขาร้านเชน)', published.length],
        ['สาขาร้านเชน (ใช้เป็นจุดนัด)', spots.filter((s) => s.chainBrand).length],
        ['มีรูป', published.filter((s) => hasImage(s.image)).length],
        ['มีคำอธิบาย (≥ 15 ตัวอักษร)', published.filter((s) => (s.description || '').trim().length >= MIN_DESCRIPTION).length],
        ['มีบรรทัดบรรยากาศ (vibeIntro)', published.filter((s) => s.vibeIntro?.trim()).length],
        ['ทีมงานเปิดให้นัดพบได้ (meetupAllowed)', published.filter((s) => s.meetupAllowed).length],
        ['ฉบับร่างรอตรวจ', drafts.length],
      ],
    ),
  );
  say();
  if (draftBySource.size) {
    say('ฉบับร่างแยกตามแหล่ง:');
    say();
    say(table(['แหล่ง', 'ฉบับร่าง'], [...draftBySource.entries()].sort((a, b) => b[1] - a[1])));
    say();
  }

  /* Challenges */
  const openQuests = quests.filter((q) => q.status !== 'ended' && q.status !== 'draft' && q.visibility !== 'private' && !(q.daysRemaining !== undefined && q.daysRemaining <= 0));
  say(`## ชาเลนจ์`);
  say();
  say(`เปิดอยู่ ${openQuests.length} · ฉบับร่าง ${quests.filter((q) => q.status === 'draft').length} · จบแล้ว ${quests.filter((q) => q.status === 'ended').length}`);
  say();

  /* Problems */
  say(`## สิ่งที่ต้องแก้`);
  say();
  const problems: [string, string[]][] = [];
  const label = (e: EventItem) => `${e.title} (${e.id}, ${provinceOf(e.province)}, ${e.date})`;
  const upcomingReal = events.filter((e) => approved(e) && eventOrigin(e) !== 'sample' && !isEventEndedByDate(e.endDate || e.date) && !e.seriesId);
  problems.push(['ตี้/อีเวนต์ที่จะมาถึง แต่ไม่มีจังหวัด', upcomingReal.filter((e) => !e.province?.trim() && e.locationType !== 'online').map(label)]);
  problems.push(['ตี้/อีเวนต์ที่จะมาถึง แต่ไม่มีสถานที่', upcomingReal.filter((e) => !e.location?.trim() && e.locationType !== 'online').map(label)]);
  problems.push(['ตี้ที่จะมาถึง แต่ไม่มีเวลา', upcomingReal.filter((e) => kindOf(e) === 'tee' && !e.time?.trim()).map(label)]);
  problems.push(['อีเวนต์ที่จะมาถึง แต่ไม่มีผู้จัด', upcomingReal.filter((e) => kindOf(e) === 'fair' && !e.hostName?.trim()).map(label)]);
  problems.push(['อีเวนต์ที่จะมาถึง แต่ไม่มีลิงก์แหล่งที่มา', upcomingReal.filter((e) => kindOf(e) === 'fair' && !e.sourceUrl && !e.externalUrl).map(label)]);
  problems.push([`ชื่อสั้นกว่า ${MIN_TITLE} ตัวอักษร`, upcomingReal.filter((e) => e.title.trim().length < MIN_TITLE).map(label)]);
  problems.push([`คำอธิบายสั้นกว่า ${MIN_DESCRIPTION} ตัวอักษร`, upcomingReal.filter((e) => textOutsideTags(e.description || '').trim().length < MIN_DESCRIPTION).map(label)]);
  problems.push(['จบแล้วตามวันที่ แต่ยังไม่ได้ตั้งสถานะ ended', events.filter((e) => eventOrigin(e) !== 'sample' && e.status !== 'ended' && isEventEndedByDate(e.endDate || e.date) && parseEventEndDateToTimestamp(e.endDate || e.date) > 0).map(label)]);
  // Same title in the same province on the same day: most likely one event imported twice
  const seen = new Map<string, EventItem>();
  const duplicates: string[] = [];
  for (const e of events) {
    if (e.seriesId) continue;
    const key = `${norm(e.title)}|${provinceOf(e.province)}|${parseEventDateToTimestamp(e.date)}`;
    const first = seen.get(key);
    if (first) duplicates.push(`${e.title} (${first.id} กับ ${e.id})`);
    else seen.set(key, e);
  }
  problems.push(['น่าจะซ้ำกัน (ชื่อ จังหวัด และวันเดียวกัน)', duplicates]);
  problems.push(['รูปตี้/อีเวนต์ชี้ไปไฟล์ที่ไม่มีใน public/', events.filter((e) => missingLocal(e.image)).map((e) => `${label(e)} → ${e.image}`)]);
  const spotLabel = (s: LifestyleSpotItem) => `${s.title} (${s.id}, ${provinceOf(s.province)})`;
  problems.push(['ที่เที่ยวเผยแพร่แล้ว แต่ไม่มีรูป', published.filter((s) => !hasImage(s.image)).map(spotLabel)]);
  problems.push(['ที่เที่ยวเผยแพร่แล้ว แต่ไม่มีเวลาเปิด', published.filter((s) => !s.openHours?.trim()).map(spotLabel)]);
  problems.push(['ที่เที่ยวเผยแพร่แล้ว แต่ไม่มีพิกัด', published.filter((s) => !s.latitude || !s.longitude).map(spotLabel)]);
  problems.push(['รูปที่เที่ยวชี้ไปไฟล์ที่ไม่มีใน public/', published.filter((s) => missingLocal(s.image)).map((s) => `${spotLabel(s)} → ${s.image}`)]);
  problems.push(['ชาเลนจ์ที่เปิดอยู่ แต่ไม่มีรูป', openQuests.filter((q) => !hasImage(q.image) && !hasImage(q.badgeCoverImg)).map((q) => `${q.title} (${q.id})`)]);
  for (const [title, items] of problems) {
    say(`- **${title}:** ${items.length}`);
    if (items.length) say(examples(items));
  }
  say();

  const snapshot: Snapshot = {
    database,
    at: new Date(now).toISOString(),
    events: events.map((e) => ({ id: e.id, title: e.title, province: provinceOf(e.province), date: e.date, kind: kindOf(e), origin: eventOrigin(e), source: e.source, sourceUrl: e.sourceUrl, approval: e.approvalStatus })),
    spots: spots.map((s) => ({ id: s.id, title: s.title, province: provinceOf(s.province), status: s.publicationStatus || 'published', origin: spotOrigin(s), source: s.sourceName, sourceUrl: s.sourceUrl, hasImage: hasImage(s.image) })),
  };
  return { report: lines.join('\n'), snapshot };
}

/* ---------- dev vs live ---------- */

function diff(firstFile: string, secondFile: string) {
  // A file saved by a Windows tool may start with a byte-order mark
  const [a, b] = [firstFile, secondFile].map((f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')) as Snapshot);
  // Ids can differ between databases, so a record is matched by its source link, or by title, province (and date)
  const spotKey = (s: Snapshot['spots'][number]) => s.sourceUrl || `${norm(s.title)}|${s.province}`;
  const eventKey = (e: Snapshot['events'][number]) => e.sourceUrl || `${norm(e.title)}|${e.province}|${e.date}`;
  const inB = { spots: new Set(b.spots.map(spotKey)), events: new Set(b.events.map(eventKey)) };
  const spotsOnly = a.spots.filter((s) => s.origin !== 'sample' && !inB.spots.has(spotKey(s)));
  const eventsOnly = a.events.filter((e) => e.origin !== 'sample' && !inB.events.has(eventKey(e)));
  const group = <T,>(items: T[], key: (item: T) => string) => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1]);
  };
  const lines = [
    `# มีใน ${a.database} แต่ไม่มีใน ${b.database}`,
    '',
    `ตรวจเมื่อ ${a.at} กับ ${b.at} · จับคู่ด้วยลิงก์แหล่งที่มา หรือชื่อ + จังหวัด (+ วันที่สำหรับตี้/อีเวนต์) · ไม่นับข้อมูลตัวอย่าง`,
    '',
    `## ที่เที่ยว ${spotsOnly.length} แห่ง (เผยแพร่แล้ว ${spotsOnly.filter((s) => s.status !== 'draft').length} · ฉบับร่าง ${spotsOnly.filter((s) => s.status === 'draft').length} · มีรูป ${spotsOnly.filter((s) => s.hasImage).length})`,
    '',
    table(['แหล่ง', 'จำนวน'], group(spotsOnly, (s) => sourceGroup(s.source))),
    '',
    table(['จังหวัด', 'จำนวน'], group(spotsOnly, (s) => s.province).slice(0, 30)),
    '',
    `## ตี้และอีเวนต์ ${eventsOnly.length} รายการ`,
    '',
    table(['ประเภท / แหล่ง', 'จำนวน'], group(eventsOnly, (e) => `${e.kind === 'tee' ? 'ตี้' : 'อีเวนต์'} · ${sourceGroup(e.source)}`)),
    '',
  ];
  return lines.join('\n');
}

/* ---------- run ---------- */

async function main() {
  const diffArg = arg('diff');
  if (diffArg) {
    const [first, second] = diffArg.split(',');
    if (!first || !second) throw new Error('--diff=first.json,second.json');
    const text = diff(first, second);
    const out = arg('out');
    if (out) fs.writeFileSync(out, text);
    console.log(text);
    return;
  }
  // .env.local holds the live database's POSTGRES_* settings but not DATA_STORE / DATABASE_URL (Vercel sets those),
  // so `--env-file=.env.local` alone would quietly audit the JSON files instead
  if (!USE_POSTGRES && (process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL)) {
    throw new Error('A database URL is set but DATA_STORE is not "postgres", so this would read data/*.json. See the header of db/audit-content.ts.');
  }
  const { report, snapshot } = await audit();
  const out = arg('out');
  const json = arg('json');
  if (out) fs.writeFileSync(out, report);
  if (json) fs.writeFileSync(json, JSON.stringify(snapshot));
  console.log(report);
  if (out || json) console.error(`\nบันทึกแล้ว: ${[out, json].filter(Boolean).join(', ')}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
