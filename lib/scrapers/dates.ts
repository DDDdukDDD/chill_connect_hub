const THAI_SHORT_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function parseIso(value: string): Date | null {
  // Date-only values are calendar days in Thailand, not UTC midnight
  const date = value.includes('T') ? new Date(value) : new Date(`${value.slice(0, 10)}T00:00:00+07:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

/**
 * Stored event dates use the Thai display format ("12 ต.ค. 2026") that `lib/dateUtils` parses
 * and deduplication compares. Converts ISO dates from sources; other values pass through unchanged.
 */
export function toThaiDisplayDate(value: string): string;
export function toThaiDisplayDate(value: string | undefined): string | undefined;
export function toThaiDisplayDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) return trimmed || undefined;
  const date = parseIso(trimmed);
  if (!date) return trimmed;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return `${part('day')} ${THAI_SHORT_MONTHS[part('month') - 1]} ${part('year')}`;
}

/** "HH:MM" in Bangkok time, only when the value carries a time of day. */
export function bangkokTime(value: string | undefined): string | undefined {
  if (!value || !value.includes('T')) return undefined;
  const date = parseIso(value);
  return date ? date.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) : undefined;
}

export interface CalendarDay {
  year: number;
  month: number; // 0-11
  day: number;
}

const THAI_MONTH_NAMES: string[][] = [
  ['มกราคม', 'ม.ค.'], ['กุมภาพันธ์', 'ก.พ.'], ['มีนาคม', 'มี.ค.'], ['เมษายน', 'เม.ย.'],
  ['พฤษภาคม', 'พ.ค.'], ['มิถุนายน', 'มิ.ย.'], ['กรกฎาคม', 'ก.ค.'], ['สิงหาคม', 'ส.ค.'],
  ['กันยายน', 'ก.ย.'], ['ตุลาคม', 'ต.ค.'], ['พฤศจิกายน', 'พ.ย.'], ['ธันวาคม', 'ธ.ค.'],
];
const MONTH_INDEX = new Map<string, number>(
  THAI_MONTH_NAMES.flatMap((names, index) => names.flatMap((name) => [[name, index], [name.replace(/\.$/, ''), index]] as [string, number][]))
);
const MONTH_PATTERN = [...MONTH_INDEX.keys()]
  .sort((left, right) => right.length - left.length)
  .map((name) => name.replace(/\./g, '\\.'))
  .join('|');
const YEAR_PATTERN = '(?:พ\\.ศ\\.\\s*)?(25\\d{2}|20\\d{2})';
const RANGE = new RegExp(`(?<!\\d)(\\d{1,2})\\s*(?:(${MONTH_PATTERN})\\s*(?:${YEAR_PATTERN})?\\s*)?[-–—]\\s*(\\d{1,2})\\s*(${MONTH_PATTERN})\\s*(?:${YEAR_PATTERN})?`);
const SINGLE = new RegExp(`(?<!\\d)(\\d{1,2})\\s*(${MONTH_PATTERN})\\s*(?:${YEAR_PATTERN})?`);

const toCe = (year: string | undefined) => (year ? (Number(year) > 2500 ? Number(year) - 543 : Number(year)) : undefined);
const validDay = (day: number) => day >= 1 && day <= 31;

export function calendarDayEnd(day: CalendarDay): number {
  return Date.UTC(day.year, day.month, day.day, 23, 59, 59) - 7 * 60 * 60 * 1000; // Bangkok is UTC+7
}

export function formatThaiDay(day: CalendarDay): string {
  return `${day.day} ${THAI_SHORT_MONTHS[day.month]} ${day.year}`;
}

/**
 * Finds the first Thai date or date range in free text, e.g. "03-04 ตุลาคม 2569",
 * "23 ตุลาคม - 01 พฤศจิกายน 2569", "24 ก.ย. – 25 ต.ค.". Buddhist years are converted;
 * a missing year is inferred so the date is not more than ~3 months in the past.
 */
export function parseThaiDateRange(text: string, now: number = Date.now()): { start: CalendarDay; end: CalendarDay } | null {
  const range = text.match(RANGE);
  const single = text.match(SINGLE);
  const useRange = range && (!single || (range.index ?? 0) <= (single.index ?? 0));

  let startDay: number, endDay: number, startMonth: number, endMonth: number;
  let startYear: number | undefined, endYear: number | undefined;
  if (useRange && range) {
    [startDay, endDay] = [Number(range[1]), Number(range[4])];
    endMonth = MONTH_INDEX.get(range[5])!;
    startMonth = range[2] ? MONTH_INDEX.get(range[2])! : endMonth;
    endYear = toCe(range[6]);
    startYear = toCe(range[3]);
  } else if (single) {
    startDay = endDay = Number(single[1]);
    startMonth = endMonth = MONTH_INDEX.get(single[2])!;
    startYear = endYear = toCe(single[3]);
  } else {
    return null;
  }
  if (!validDay(startDay) || !validDay(endDay)) return null;

  if (endYear === undefined) {
    const current = new Date(now).getUTCFullYear();
    endYear = current;
    if (calendarDayEnd({ year: endYear, month: endMonth, day: endDay }) < now - 90 * 24 * 60 * 60 * 1000) endYear++;
  }
  startYear ??= startMonth > endMonth ? endYear - 1 : endYear;

  return {
    start: { year: startYear, month: startMonth, day: startDay },
    end: { year: endYear, month: endMonth, day: endDay },
  };
}

/** Timestamp of an ISO value, or null; date-only values count as the end of that day when `endOfDay` is set. */
export function isoTimestamp(value: string | undefined, endOfDay = false): number | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const date = parseIso(value);
  if (!date) return null;
  return !value.includes('T') && endOfDay ? date.getTime() + 24 * 60 * 60 * 1000 - 1 : date.getTime();
}
