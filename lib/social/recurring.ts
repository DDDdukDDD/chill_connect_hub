import { db } from '../db';
import type { DayOfWeek, EventItem } from '../../data/mockData';

/**
 * A recurring ตี้ ("ทุกวันอาทิตย์") is a series; members join one date at a time (owner 2026-10-23: each date has its
 * own seats). A date becomes its own event, "<seriesId>--YYYY-MM-DD", the first time someone joins it, so tickets,
 * host check-in, chat, reviews and the waiting list all work per date with no special cases. Dates are not listed
 * on their own (lib/db/queryEngine.ts hides `seriesId`); their pages point search engines at the series.
 */
const DAY_INDEX: Record<DayOfWeek, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const BANGKOK_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DATES = 8;

export const isSeries = (event: Pick<EventItem, 'scheduleType' | 'recurrence'>) => event.scheduleType === 'recurring' && Boolean(event.recurrence?.daysOfWeek?.length);
export const instanceIdOf = (seriesId: string, ymd: string) => `${seriesId}--${ymd}`;

/** Today in Bangkok as YYYY-MM-DD */
const bangkokYmd = (ms: number) => new Date(ms + BANGKOK_MS).toISOString().slice(0, 10);

/** "29 ต.ค. 2569", the date format the rest of the site reads */
export function thaiDateOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** "อา. 26 ต.ค." for the date list */
export function shortLabelOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${THAI_DAYS[day]} ${d} ${THAI_MONTHS[m - 1]}`;
}

/** Start time of a date ("17:30 - 19:00 น." → 17:30 Bangkok), to drop dates already started today */
function startsAt(ymd: string, time: string | undefined): number {
  const match = /(\d{1,2})[:.](\d{2})/.exec(time ?? '');
  const [h, min] = match ? [Number(match[1]), Number(match[2])] : [23, 59];
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d, h, min) - BANGKOK_MS;
}

/** The next dates of a series, from now, honouring weekly / biweekly / monthly and an end date */
export function nextDatesOf(series: EventItem, count = MAX_DATES, now = Date.now()): string[] {
  const rec = series.recurrence;
  if (!rec?.daysOfWeek?.length) return [];
  const days = new Set(rec.daysOfWeek.map((d) => DAY_INDEX[d]));
  const until = rec.endType === 'on_date' && rec.endDate ? rec.endDate.slice(0, 10) : null;
  const dates: string[] = [];
  const seenMonths = new Map<string, number>();
  for (let i = 0; i < 120 && dates.length < count; i++) {
    const ymd = bangkokYmd(now + i * DAY_MS);
    if (until && ymd > until) break;
    const [y, m, d] = ymd.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (!days.has(weekday)) continue;
    if (startsAt(ymd, series.time) <= now) continue;
    if (rec.frequency === 'biweekly' && Math.floor(i / 7) % 2 === 1) continue;
    if (rec.frequency === 'monthly') {
      // Monthly: the first matching day of each month
      const key = `${y}-${m}`;
      if (seenMonths.has(key)) continue;
      seenMonths.set(key, d);
    }
    dates.push(ymd);
  }
  return dates;
}

/** The dates with their seats taken, for the series page */
export async function datesWithSeats(series: EventItem) {
  const dates = nextDatesOf(series);
  return Promise.all(
    dates.map(async (ymd) => {
      const instance = await db.findEventById(instanceIdOf(series.id, ymd));
      const taken = instance?.participantsCount ?? 0;
      return { date: ymd, label: shortLabelOf(ymd), eventId: instance?.id ?? null, taken, max: series.maxParticipants, full: taken >= series.maxParticipants };
    })
  );
}

/** The event of one date, created from the series the first time someone joins it */
export async function ensureInstance(series: EventItem, ymd: string): Promise<EventItem> {
  const id = instanceIdOf(series.id, ymd);
  const existing = await db.findEventById(id);
  if (existing) return existing;
  const { id: _seriesId, createdAtTimestamp: _created, recurrence: _recurrence, ...rest } = series;
  void _seriesId;
  void _created;
  void _recurrence;
  return db.createEvent({
    ...rest,
    id,
    seriesId: series.id,
    scheduleType: 'single',
    date: thaiDateOf(ymd),
    participantsCount: 0,
    status: 'upcoming',
  });
}
