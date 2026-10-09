import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { CalendarDay, formatThaiDay, parseThaiDateRange } from './scrapers/dates';

/**
 * Keeps the bundled sample community meetups (MOCK_EVENTS) in the future during the prototype stage.
 *
 * The samples were written with fixed dates (Aug–Oct 2026), so they expire and disappear from feeds.
 * When a sample has ended, it is moved forward by whole "cycles" (the span of the sample set rounded
 * up to whole weeks), which keeps each meetup's weekday and the spacing between meetups.
 * Applied when events are read; stored data is not changed. Member-created and scraped events are never
 * touched: only community events whose id belongs to MOCK_EVENTS roll.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const SAMPLE_IDS = new Set(MOCK_EVENTS.map((event) => event.id));

const toUtcDay = (day: CalendarDay) => Date.UTC(day.year, day.month, day.day);
const fromUtcDay = (time: number): CalendarDay => {
  const date = new Date(time);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
};

// Only dates with an explicit year are sample calendar dates; "ทุกวันพุธและศุกร์" and the like are not
function parseFixedDate(text: string | undefined): { start: number; end: number } | null {
  if (!text || !/(20\d{2}|25\d{2})/.test(text)) return null;
  const range = parseThaiDateRange(text);
  return range ? { start: toUtcDay(range.start), end: toUtcDay(range.end) } : null;
}

// Fairs in MOCK_EVENTS run into 2027, so only community samples define the cycle
// (a few seeds have no eventType; anything that is not a public venue counts as community)
const CYCLE_MS = (() => {
  const starts = MOCK_EVENTS
    .filter((event) => event.eventType !== 'public_venue' && event.scheduleType !== 'recurring')
    .map((event) => parseFixedDate(event.date)?.start)
    .filter((start): start is number => start !== undefined);
  if (starts.length === 0) return 8 * 7 * DAY_MS;
  const spanWeeks = Math.ceil((Math.max(...starts) - Math.min(...starts)) / DAY_MS / 7) + 1;
  return Math.max(4, spanWeeks) * 7 * DAY_MS;
})();

function todayInBangkok(now: number): number {
  return Math.floor((now + BANGKOK_OFFSET_MS) / DAY_MS) * DAY_MS;
}

/** The event with its date rolled forward when it is an ended sample meetup; otherwise the same object. */
export function rollSampleEventDate<T extends EventItem>(event: T, now: number = Date.now()): T {
  if (event.eventType !== 'community' || !SAMPLE_IDS.has(event.id)) return event;
  if (event.status === 'ended' || event.scheduleType === 'recurring') return event;
  const parsed = parseFixedDate(event.date);
  if (!parsed) return event;

  const today = todayInBangkok(now);
  if (parsed.end >= today) return event;
  const cycles = Math.ceil((today - parsed.end) / CYCLE_MS);
  const start = parsed.start + cycles * CYCLE_MS;
  const end = parsed.end + cycles * CYCLE_MS;
  const date = start === end
    ? formatThaiDay(fromUtcDay(start))
    : `${formatThaiDay(fromUtcDay(start))} - ${formatThaiDay(fromUtcDay(end))}`;
  return { ...event, date };
}

export function rollSampleEventDates<T extends EventItem>(events: T[], now: number = Date.now()): T[] {
  return events.map((event) => rollSampleEventDate(event, now));
}

export const SAMPLE_EVENT_CYCLE_DAYS = CYCLE_MS / DAY_MS;
