import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from '@/lib/db';
import { spotListItem } from '@/lib/listItems';
import { isClosedToJoin, isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { listPublicFairs, listPublicMeetups, listPublicQuests } from '@/lib/publicContent';

/**
 * "สัปดาห์นี้" (owner 2026-11-19): the first view of กิจกรรม, laid out as a schedule of the next 7 days so the question
 * "I am free on this day, where shall I go, and who is going" is answered at a glance. It replaced the weekend-only
 * draft: weekday evenings count too, and a day-by-day schedule is a different job from the landing's category rows.
 *
 * Days run from today in Bangkok. A ตี้ sits on its start day; an อีเวนต์ sits on the day it starts, and one that
 * already runs (started before today) is listed once as "กำลังจัดอยู่" instead of on every day. Event dates are read
 * in the server's local frame by lib/dateUtils, so the day bounds are built in that same frame from the Bangkok day.
 */

import { LATER_DAYS, WEEK_DAYS, WEEK_PLACES } from '@/lib/thisWeekRules';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
const WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeekDay {
  /** "YYYY-MM-DD", the Bangkok calendar day (also how "ไปกัน" plans store their day) */
  iso: string;
  /** For the day strip: "วันนี้", "พรุ่งนี้", "ส. 21" */
  short: string;
  /** For the section heading: "วันนี้ · พฤหัสฯ 19 พ.ย." */
  heading: string;
  /** For the friends row and empty days: "วันนี้", "พรุ่งนี้", "เสาร์ 21" */
  name: string;
  weekend: boolean;
  start: number;
  end: number;
}

export function weekDays(now = new Date()): WeekDay[] {
  const bangkok = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const y = bangkok.getUTCFullYear();
  const m = bangkok.getUTCMonth();
  const d = bangkok.getUTCDate();
  return Array.from({ length: WEEK_DAYS }, (_, i) => {
    const date = new Date(y, m, d + i);
    const weekday = date.getDay();
    const dayMonth = `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`;
    const relative = i === 0 ? 'วันนี้' : i === 1 ? 'พรุ่งนี้' : '';
    return {
      iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      short: relative || `${WEEKDAYS_SHORT[weekday]} ${date.getDate()}`,
      heading: relative ? `${relative} · ${WEEKDAYS[weekday]} ${dayMonth}` : `${WEEKDAYS[weekday]} ${dayMonth}`,
      name: relative || `${WEEKDAYS[weekday]} ${date.getDate()}`,
      weekend: weekday === 0 || weekday === 6,
      start: date.getTime(),
      end: date.getTime() + DAY_MS - 1,
    };
  });
}

/** "พฤ. 19 – พ. 25 พ.ย." */
export function weekLabel(days: WeekDay[]): string {
  const first = new Date(days[0].start);
  const last = new Date(days[days.length - 1].start);
  const sameMonth = first.getMonth() === last.getMonth();
  const left = `${WEEKDAYS_SHORT[first.getDay()]} ${first.getDate()}${sameMonth ? '' : ` ${THAI_MONTHS[first.getMonth()]}`}`;
  return `${left} – ${WEEKDAYS_SHORT[last.getDay()]} ${last.getDate()} ${THAI_MONTHS[last.getMonth()]}`;
}

const isOpenQuest = (quest: ChallengeQuest) =>
  quest.status !== 'ended' && quest.status !== 'draft' && quest.visibility !== 'private' && !(quest.daysRemaining !== undefined && quest.daysRemaining <= 0);

/** A ตี้ or อีเวนต์ on a day of the schedule, in start-time order within the day */
export interface WeekItem {
  kind: 'tee' | 'fair';
  event: EventItem;
}

export interface WeekContent {
  days: WeekDay[];
  /** By day iso: what starts that day */
  byDay: Record<string, WeekItem[]>;
  /** อีเวนต์ that started before today and still run */
  ongoing: EventItem[];
  /** Every open challenge, most people first: the page shows the member's own ("ชาเลนจ์ที่คุณทำอยู่") and the popular ones */
  quests: ChallengeQuest[];
  /** "ที่น่าไปวันว่าง" for all of Thailand (the page asks again for a picked province): with a photo, no chain branches */
  places: LifestyleSpotItem[];
  /**
   * "เร็วๆ นี้" (BE-450): open ตี้ and อีเวนต์ that start after the 7 days, up to LATER_DAYS from today, soonest first.
   * A thin week shows them so the page always has something to go to.
   */
  later: WeekItem[];
}

const startTime = (event: EventItem) => (event.time || '').match(/\d{1,2}[:.]\d{2}/)?.[0]?.replace('.', ':').padStart(5, '0') ?? '99:99';

export async function weekContent(now = new Date()): Promise<WeekContent> {
  const days = weekDays(now);
  const first = days[0].start;
  const last = days[days.length - 1].end;
  const [allMeetups, allFairs, allQuests, placePage] = await Promise.all([
    listPublicMeetups(),
    listPublicFairs(),
    listPublicQuests(),
    db.findSpots({ page: 1, limit: WEEK_PLACES, hasImageOnly: true, excludeChains: true }),
  ]);
  const byDay: Record<string, WeekItem[]> = Object.fromEntries(days.map((day) => [day.iso, []]));
  const dayOf = (timestamp: number) => days.find((day) => timestamp >= day.start && timestamp <= day.end);
  const laterEnd = days[0].start + LATER_DAYS * DAY_MS - 1;
  const isLater = (timestamp: number) => timestamp > last && timestamp <= laterEnd;
  const later: WeekItem[] = [];

  // Open ตี้ only: one already started or closed to joining is no answer to "where shall we go"
  for (const event of allMeetups) {
    if ((event.eventType || 'community') !== 'community' || isClosedToJoin(event)) continue;
    const start = parseEventDateToTimestamp(event.date);
    const day = dayOf(start);
    if (day) byDay[day.iso].push({ kind: 'tee', event });
    else if (isLater(start)) later.push({ kind: 'tee', event });
  }
  const ongoing: EventItem[] = [];
  for (const event of allFairs) {
    if (isEventEnded(event)) continue;
    const start = parseEventDateToTimestamp(event.date);
    const end = parseEventEndDateToTimestamp(event.endDate || event.date);
    if (isLater(start)) {
      later.push({ kind: 'fair', event });
      continue;
    }
    if (start > last || end < first) continue;
    const day = dayOf(start);
    if (day) byDay[day.iso].push({ kind: 'fair', event });
    else if (start < first) ongoing.push(event);
  }
  for (const items of Object.values(byDay)) items.sort((a, b) => startTime(a.event).localeCompare(startTime(b.event)));
  // The ones ending soonest first: a last chance reads before one that runs all month
  ongoing.sort((a, b) => parseEventEndDateToTimestamp(a.endDate || a.date) - parseEventEndDateToTimestamp(b.endDate || b.date));
  // Challenges are not tied to a day: the open ones most people are doing, for any free day
  const quests = allQuests.filter(isOpenQuest).sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0));
  later.sort((a, b) => parseEventDateToTimestamp(a.event.date) - parseEventDateToTimestamp(b.event.date));
  return { days, byDay, ongoing, quests, places: placePage.items.map(spotListItem), later };
}
