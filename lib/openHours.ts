/**
 * Opening hours as people read them. The Tourism Directory import lists every day (or day pair) on its own:
 * "จ. 16:30-23:00 น. · จ.-อ. 16:30-23:00 น. · … · อา. 16:30-23:00 น.". When every part has the same times and the
 * week runs from จ. to อา., that is "ทุกวัน 16:30-23:00 น."; anything else is returned as it came.
 */
export function tidyOpenHours(text?: string): string {
  const clean = (text || '').trim();
  const parts = clean.split(/\s*[·;]\s*/).filter(Boolean);
  if (parts.length < 2) return clean;
  const times = parts.map((part) => part.match(/\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}(\s*น\.)?/)?.[0]);
  if (times.some((time) => !time) || new Set(times.map((time) => time!.replace(/\s/g, ''))).size > 1) return clean;
  const days = parts.join(' ');
  if (!/(^|\s)จ\./.test(days) || !/อา\./.test(days)) return clean;
  return `ทุกวัน ${times[0]}`;
}

export interface SpotOpenStatus {
  isOpen: boolean;
  statusText: string;
  subText?: string;
  badgeVariant: 'open' | 'closed' | 'unspecified';
}

// Thai day short forms in opening hours; longer ones first so "พฤ." is not read as "พ." and "อา." not as "อ."
const THAI_DAY_INDEX: Record<string, number> = { 'อา': 0, 'จ': 1, 'อ': 2, 'พ': 3, 'พฤ': 4, 'ศ': 5, 'ส': 6 };
const THAI_DAY_NAME = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสฯ', 'วันศุกร์', 'วันเสาร์'];
const DAY_SPEC = /(อา|พฤ|จ|อ|พ|ศ|ส)\.(?:\s*[-–]\s*(อา|พฤ|จ|อ|พ|ศ|ส)\.)?/;

/** Open or closed now, from the opening hours (the place page badge and the /spots "เปิดอยู่ตอนนี้" filter). `now` is for tests */
export function parseSpotOpenStatus(openHours?: string, now: number = Date.now()): SpotOpenStatus {
  if (!openHours || /ไม่ระบุ/i.test(openHours)) {
    return {
      isOpen: false,
      statusText: 'เวลาทำการตามประกาศ',
      subText: 'โปรดตรวจสอบก่อนเดินทาง',
      badgeVariant: 'unspecified' };
  }

  const clean = openHours.trim();

  // 24 hours check
  if (/24\s*(ชั่วโมง|ชม)/i.test(clean) || /00:00\s*[-–]\s*23:59/i.test(clean) || /00:00\s*[-–]\s*24:00/i.test(clean)) {
    return {
      isOpen: true,
      statusText: 'เปิดตลอด 24 ชั่วโมง',
      badgeVariant: 'open' };
  }

  // Thailand time (UTC+7)
  const thaiNow = new Date(now + 7 * 60 * 60 * 1000);
  const currentMinutes = thaiNow.getUTCHours() * 60 + thaiNow.getUTCMinutes();
  const currentDay = thaiNow.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  if (/ปิดวันจันทร์/.test(clean) && currentDay === 1) {
    return {
      isOpen: false,
      statusText: 'ปิดทำการวันนี้',
      subText: 'ปิดทุกวันจันทร์',
      badgeVariant: 'closed',
    };
  }

  // Hours come in parts, each with its own days: "จ.-ศ. 08:00-17:00 · ส.-อา. 09:00-18:00 น." A part without days is every day
  const shifts = clean.split('·').flatMap((part) => {
    const time = part.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
    if (!time) return [];
    const days = part.match(DAY_SPEC);
    const from = days ? THAI_DAY_INDEX[days[1]] : 0;
    const to = days ? THAI_DAY_INDEX[days[2] ?? days[1]] : 6;
    const onDays = new Set<number>();
    for (let d = from; ; d = (d + 1) % 7) {
      onDays.add(d);
      if (d === to) break;
    }
    return [{ onDays, open: Number(time[1]) * 60 + Number(time[2]), close: Number(time[3]) * 60 + Number(time[4]), opens: `${time[1]}:${time[2]}`, closes: `${time[3]}:${time[4]}` }];
  });
  if (shifts.length > 0) {
    const today = shifts.filter((shift) => shift.onDays.has(currentDay)).sort((x, y) => x.open - y.open);
    // A close earlier than the open runs past midnight
    const openNow = today.find((shift) => (shift.close > shift.open ? currentMinutes >= shift.open && currentMinutes < shift.close : currentMinutes >= shift.open || currentMinutes < shift.close));
    if (openNow) return { isOpen: true, statusText: 'เปิดให้บริการอยู่', subText: `ปิด ${openNow.closes} น.`, badgeVariant: 'open' };
    const laterToday = today.find((shift) => shift.open > currentMinutes);
    if (laterToday) return { isOpen: false, statusText: 'ปิดให้บริการแล้ว', subText: `เปิด ${laterToday.opens} น.`, badgeVariant: 'closed' };
    for (let ahead = 1; ahead <= 7; ahead++) {
      const day = (currentDay + ahead) % 7;
      const next = shifts.filter((shift) => shift.onDays.has(day)).sort((x, y) => x.open - y.open)[0];
      if (next) {
        return {
          isOpen: false,
          statusText: today.length > 0 ? 'ปิดให้บริการแล้ว' : 'ปิดทำการวันนี้',
          subText: ahead === 1 ? `เปิดพรุ่งนี้ ${next.opens} น.` : `เปิด${THAI_DAY_NAME[day]} ${next.opens} น.`,
          badgeVariant: 'closed',
        };
      }
    }
  }

  return {
    isOpen: true,
    statusText: clean.length > 25 ? 'เปิดให้บริการ' : clean,
    badgeVariant: 'open',
  };
}

/** True only when the hours say the place is open now (24 hours or a matching time). Hours that cannot be read count as not open */
export function isSpotOpenNow(openHours?: string, now: number = Date.now()): boolean {
  const status = parseSpotOpenStatus(tidyOpenHours(openHours), now);
  return status.badgeVariant === 'open' && (status.statusText === 'เปิดตลอด 24 ชั่วโมง' || status.statusText === 'เปิดให้บริการอยู่');
}
