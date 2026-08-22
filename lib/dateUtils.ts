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

  let month = 7; // Default August
  for (const [mName, mIdx] of Object.entries(THAI_MONTHS_MAP)) {
    if (str.includes(mName)) {
      month = mIdx;
      break;
    }
  }

  let day = 1;
  const dayMatch = str.match(/(\d{1,2})/);
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
  let month = 7;
  for (const [mName, mIdx] of Object.entries(THAI_MONTHS_MAP)) {
    if (str.includes(mName)) {
      month = mIdx;
    }
  }

  // Extract end day (if "9 - 12 ก.ค." extract 12; if "16 ก.ค. - 19 ก.ค." extract 19)
  let day = 1;
  const allDays = Array.from(str.matchAll(/(\d{1,2})/g)).map((m) => parseInt(m[1], 10));
  if (allDays.length > 0) {
    day = allDays[allDays.length - 1];
  }

  return new Date(year, month, day, 23, 59, 59).getTime();
}

export function isEventEndedByDate(dateStr: string): boolean {
  if (!dateStr) return false;
  // Current app reference date: 22 August 2026
  const endTimestamp = parseEventEndDateToTimestamp(dateStr);
  const now = new Date(2026, 7, 22, 0, 0, 0).getTime();
  return endTimestamp < now;
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
