/**
 * Facilities worth telling a visitor, from the mixed lists the Tourism Directory gives every place.
 * Its lists repeat the same generic items on hundreds of places (a VAT refund desk at a village temple, pet
 * lodging, hotels nearby), so only items that change a visit are kept, in plain words, once each (owner 2026-10-25).
 */
const KEEP: Array<[RegExp, string]> = [
  [/ห้องน้ำสำหรับคนพิการ|ทางลาด|วีลแชร์|รถเข็น|ลิฟท์|ลิฟต์/, 'รองรับวีลแชร์'],
  [/ห้องน้ำ|สุขา/, 'ห้องน้ำ'],
  [/ลานจอด|ที่จอดรถ|อาคารจอด/, 'ที่จอดรถ'],
  [/ร้านอาหาร/, 'ร้านอาหาร'],
  [/ร้านกาแฟ|คาเฟ่/, 'ร้านกาแฟ'],
  [/ของที่ระลึก/, 'ร้านของที่ระลึก'],
  [/กางเต็นท์/, 'ลานกางเต็นท์'],
  [/ศูนย์บริการนักท่องเที่ยว/, 'ศูนย์บริการนักท่องเที่ยว'],
  [/มัคคุเทศก์|ไกด์/, 'มีไกด์ท้องถิ่น'],
  [/wi-?fi|ไวไฟ/i, 'Wi-Fi'],
];

export function visitorFacilities(list: string[] | undefined): string[] {
  const out: string[] = [];
  for (const item of list ?? []) {
    const hit = KEEP.find(([pattern]) => pattern.test(item));
    if (hit && !out.includes(hit[1])) out.push(hit[1]);
  }
  return out;
}

/** "เดินทางโดย มอเตอร์ไซด์, รถยนต์" → "มอเตอร์ไซค์ · รถยนต์" (the Tourism Directory's ways to get there) */
export function travelModes(transitInfo: string | undefined): string {
  return (transitInfo ?? '')
    .replace(/^\s*เดินทางโดย\s*/, '')
    .replace(/มอเตอร์ไซด์/g, 'มอเตอร์ไซค์')
    .split(/\s*,\s*/)
    .filter(Boolean)
    .join(' · ');
}
