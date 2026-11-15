import { parseEventDateToTimestamp, parseEventEndDateToTimestamp } from './dateUtils';

/**
 * The days a group inside an อีเวนต์ can meet (owner 2026-11-15): from the first day (or today, once it has begun) to
 * the last, in Bangkok. Shared by the form (components/detail/FairGroupDialog.tsx) and the server check
 * (lib/social/fairGroups.ts), so both offer and accept the same days. Empty when the dates cannot be read.
 */
export const FAIR_GROUP_MAX_DAYS = 120;
const DAY_MS = 86_400_000;
const BANGKOK_MS = 7 * 3_600_000;
export const bangkokYmd = (at: number = Date.now()) => new Date(at + BANGKOK_MS).toISOString().slice(0, 10);

export function fairGroupDays(event: { date?: string; endDate?: string }, now: number = Date.now()): string[] {
  if (!event.date) return [];
  const start = parseEventDateToTimestamp(event.date);
  const end = parseEventEndDateToTimestamp(event.endDate || event.date);
  if (!start || !end) return [];
  const first = [bangkokYmd(start), bangkokYmd(now)].sort()[1];
  const last = bangkokYmd(end);
  const days: string[] = [];
  for (let at = Date.parse(`${first}T00:00:00Z`); days.length < FAIR_GROUP_MAX_DAYS; at += DAY_MS) {
    const day = new Date(at).toISOString().slice(0, 10);
    if (day > last) break;
    days.push(day);
  }
  return days;
}

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
/** "ส. 22 พ.ย." */
export function fairGroupDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${THAI_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${THAI_MONTHS[m - 1]}`;
}
