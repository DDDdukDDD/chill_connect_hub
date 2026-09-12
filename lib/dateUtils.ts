export const THAI_MONTHS_MAP: Record<string, number> = {
  'ม.ค.': 0, 'มกราคม': 0, 'jan': 0,
  'ก.พ.': 1, 'กุมภาพันธ์': 1, 'feb': 1,
  'มี.ค.': 2, 'มีนาคม': 2, 'mar': 2,
  'เม.ย.': 3, 'เมษายน': 3, 'apr': 3,
  'พ.ค.': 4, 'พฤษภาคม': 4, 'may': 4,
  'มิ.ย.': 5, 'มิถุนายน': 5, 'jun': 5,
  'ก.ค.': 6, 'กรกฎาคม': 6, 'jul': 6,
  'ส.ค.': 7, 'สิงหาคม': 7, 'aug': 7,
  'ก.ย.': 8, 'กันยายน': 8, 'sep': 8,
  'ต.ค.': 9, 'ตุลาคม': 9, 'oct': 9,
  'พ.ย.': 10, 'พฤศจิกายน': 10, 'nov': 10,
  'ธ.ค.': 11, 'ธันวาคม': 11, 'dec': 11,
};

export function parseEventDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 9999999999999;
  const str = dateStr.trim().toLowerCase();

  let year = 2026;
  const yearMatch = str.match(/(202[4-9]|203[0-9]|256[7-9]|257[0-9])/);
  if (yearMatch) {
    let y = parseInt(yearMatch[1], 10);
    if (y > 2500) y -= 543;
    year = y;
  }

  let month = 8; // Default September
  for (const [mName, mIdx] of Object.entries(THAI_MONTHS_MAP)) {
    if (str.includes(mName)) {
      month = mIdx;
      break;
    }
  }

  // Strip 4-digit years first so the trailing digits of year (e.g. 26 in 2026) are not mistaken for day
  const strWithoutYear = str.replace(/(202[4-9]|203[0-9]|256[7-9]|257[0-9])/g, '');
  let day = 1;
  const dayMatch = strWithoutYear.match(/(\d{1,2})/);
  if (dayMatch) {
    day = parseInt(dayMatch[1], 10);
  }

  return new Date(year, month, day, 0, 0, 0).getTime();
}

export function parseEventEndDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 9999999999999;
  const str = dateStr.trim().toLowerCase();

  let year = 2026;
  const yearMatch = str.match(/(202[4-9]|203[0-9]|256[7-9]|257[0-9])/);
  if (yearMatch) {
    let y = parseInt(yearMatch[1], 10);
    if (y > 2500) y -= 543;
    year = y;
  }

  // Detect month (checks all months found in string, picks the last matching one for end month)
  let month = 8;
  for (const [mName, mIdx] of Object.entries(THAI_MONTHS_MAP)) {
    if (str.includes(mName)) {
      month = mIdx;
    }
  }

  // Strip 4-digit years first so trailing digits of 2026 are not captured as day
  const strWithoutYear = str.replace(/(202[4-9]|203[0-9]|256[7-9]|257[0-9])/g, '');
  let day = 1;
  const allDays = Array.from(strWithoutYear.matchAll(/(\d{1,2})/g)).map((m) => parseInt(m[1], 10));
  if (allDays.length > 0) {
    day = allDays[allDays.length - 1];
  }

  return new Date(year, month, day, 23, 59, 59).getTime();
}

export function isEventEndedByDate(dateStr: string): boolean {
  if (!dateStr) return false;
  // Compare end of event against today at 00:00:00
  const endTimestamp = parseEventEndDateToTimestamp(dateStr);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return endTimestamp < todayStart.getTime();
}

export function parseCustomDateToTimestamp(dateStr: string, isEndOfDay = false): number {
  if (!dateStr) return isEndOfDay ? 9999999999999 : 0;
  let y = 2026, m = 8, d = 1;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10) || 1;
    m = (parseInt(parts[1], 10) || 1) - 1;
    y = parseInt(parts[2], 10) || 2026;
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = (parseInt(parts[1], 10) || 1) - 1;
      d = parseInt(parts[2], 10) || 1;
    } else {
      d = parseInt(parts[0], 10) || 1;
      m = (parseInt(parts[1], 10) || 1) - 1;
      y = parseInt(parts[2], 10) || 2026;
    }
  }
  if (isEndOfDay) return new Date(y, m, d, 23, 59, 59).getTime();
  return new Date(y, m, d, 0, 0, 0).getTime();
}

/**
 * Universal time filter matcher for events across the platform.
 * Supports 'all', 'today', 'tomorrow', 'weekend', 'next_month' (current month), and 'custom'.
 */
export function isEventMatchingTimeFilter(
  eventDate: string,
  timeFilter: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (!timeFilter || timeFilter === 'all') return true;
  if (!eventDate) return true;

  const evStart = parseEventDateToTimestamp(eventDate);
  const evEnd = parseEventEndDateToTimestamp(eventDate);
  const now = new Date();

  if (timeFilter === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
    return evStart <= todayEnd && evEnd >= todayStart;
  }

  if (timeFilter === 'tomorrow') {
    const tom = new Date(now);
    tom.setDate(now.getDate() + 1);
    const tomStart = new Date(tom.getFullYear(), tom.getMonth(), tom.getDate(), 0, 0, 0).getTime();
    const tomEnd = new Date(tom.getFullYear(), tom.getMonth(), tom.getDate(), 23, 59, 59).getTime();
    return evStart <= tomEnd && evEnd >= tomStart;
  }

  if (timeFilter === 'weekend') {
    const day = now.getDay();
    const sat = new Date(now);
    if (day === 6) {
      // Today is Saturday
    } else if (day === 0) {
      // Today is Sunday, check yesterday Sat
      sat.setDate(now.getDate() - 1);
    } else {
      // Mon-Fri: find upcoming Saturday
      sat.setDate(now.getDate() + (6 - day));
    }
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const wkndStart = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate(), 0, 0, 0).getTime();
    const wkndEnd = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate(), 23, 59, 59).getTime();
    return evStart <= wkndEnd && evEnd >= wkndStart;
  }

  if (timeFilter === 'next_month') {
    // Current active month
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime();
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    return evStart <= mEnd && evEnd >= mStart;
  }

  if (timeFilter === 'custom' && (startDate || endDate)) {
    const cStart = parseCustomDateToTimestamp(startDate || endDate || '', false);
    const cEnd = parseCustomDateToTimestamp(endDate || startDate || '', true);
    return evStart <= cEnd && evEnd >= cStart;
  }

  return true;
}

export function isEventEnded(event: { status?: string; date?: string; title?: string; description?: string }): boolean {
  if (!event) return false;
  if (event.status === 'ended') return true;
  if (event.date && isEventEndedByDate(event.date)) return true;
  const t = (event.title || '').toLowerCase();
  const d = (event.description || '').toLowerCase();
  if (t.includes('งานที่ผ่านมา') || d.includes('จัดเสร็จสิ้นแล้ว')) return true;
  return false;
}

/**
 * Checks whether an event or spot should display the 'NEW' tag.
 * Strict Platform Rules:
 * 1. Ended or past events must NEVER display the NEW tag.
 * 2. The NEW tag is only valid for at most 3 days (3 * 24 * 60 * 60 * 1000 ms)
 *    from the creation date (createdAtTimestamp). After 3 days, it automatically expires.
 */
export function isEventNew(event: {
  isNew?: boolean;
  createdAtTimestamp?: number;
  status?: string;
  date?: string;
  title?: string;
  description?: string;
}): boolean {
  if (!event) return false;

  // Rule 1: Never show NEW if event has ended or is in the past
  if (isEventEnded(event)) return false;

  // Rule 2: 3-day expiration window from creation
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  if (event.createdAtTimestamp) {
    const elapsed = Date.now() - event.createdAtTimestamp;
    // Valid within 3 days (allowing small clock offset)
    return elapsed >= -60000 && elapsed <= THREE_DAYS_MS;
  }

  // Fallback: If no timestamp exists, only honor isNew if explicitly flagged and not ended
  return !!event.isNew;
}

