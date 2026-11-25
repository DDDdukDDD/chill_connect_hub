import type { LifestyleSpotItem } from '@/data/spotsData';

/**
 * Tags for how Gen Z and Y go out (owner 2026-11-26): worked out from what a place already says (category, opening
 * hours, entry fee, description), not stored, so every place has them at once, on dev and live alike, and they stay
 * right when the place changes. Shown as the place's "#tag" where staff set none, and read by search, so "ถ่ายรูป" or
 * "กลางคืน" finds places that never used those words. Order = how strongly they pull people out; at most two.
 * The catalog's ranking already favours places young people go to (spotCuration VIBE_FIT).
 */
export const AUDIENCE_TAGS = ['เที่ยวกลางคืน', 'ถ่ายรูปสวย', 'ไปกันเป็นแก๊ง', 'ไม่เสียค่าเข้า'] as const;
export type AudienceTag = (typeof AUDIENCE_TAGS)[number];

const PHOTO_CATEGORIES = new Set(['art', 'viewpoint', 'cafe', 'beach']);
const GROUP_CATEGORIES = new Set(['attraction', 'bar']);
const PHOTO_WORDS = /ถ่ายรูป|มุมสวย|จุดเช็กอิน|เช็คอิน|เช็กอิน|วิวสวย|วิวพาโนรามา|พระอาทิตย์ตก|instagram|photogenic|photo spot/i;
const NIGHT_WORDS = /ตลาดนัดกลางคืน|ตลาดกลางคืน|ไนท์มาร์เก็ต|night market|เปิดถึงดึก|ยามค่ำคืน|ไนท์ไลฟ์|nightlife|rooftop bar|รูฟท็อปบาร์/i;
const GROUP_WORDS = /บอร์ดเกม|board game|โบว์ลิ่ง|bowling|คาราโอเกะ|karaoke|ห้องหนี|escape room|ปีนผา|climbing|โกคาร์ท|go-kart|สวนน้ำ|water park|สวนสนุก|ปาร์ตี้|กลุ่มเพื่อน|แก๊งเพื่อน/i;
const FREE_WORDS = /^(ฟรี|ไม่เสียค่า|free)|เข้าชมฟรี|ไม่มีค่าเข้า|ไม่เสียค่าเข้า|free admission|free entry/i;

/** The latest closing hour in an opening-hours line ("ทุกวัน 10:00-22:00 น.", "17.00 - 01.00"), as 0–29 (after midnight counts on) */
function latestClose(openHours: string | undefined): number | null {
  if (!openHours || /ไม่ระบุ/.test(openHours)) return null;
  let latest: number | null = null;
  for (const match of openHours.matchAll(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/g)) {
    const [open, close] = [Number(match[1]), Number(match[3])];
    const hour = close < open && close <= 5 ? close + 24 : close;
    if (latest === null || hour > latest) latest = hour;
  }
  return latest;
}

export function audienceTags(spot: Pick<LifestyleSpotItem, 'category' | 'openHours' | 'entryFee' | 'price' | 'description' | 'title' | 'vibeIntro'>): AudienceTag[] {
  const text = `${spot.title || ''} ${spot.description || ''} ${spot.vibeIntro || ''}`;
  const close = latestClose(spot.openHours);
  const tags: AudienceTag[] = [];
  // Open to 23:00 or later: a restaurant closing at 22:00 is dinner, not a night out
  if (spot.category === 'bar' || (close !== null && close >= 23) || NIGHT_WORDS.test(text)) tags.push('เที่ยวกลางคืน');
  if (PHOTO_CATEGORIES.has(spot.category) || PHOTO_WORDS.test(text)) tags.push('ถ่ายรูปสวย');
  if (GROUP_CATEGORIES.has(spot.category) || GROUP_WORDS.test(text)) tags.push('ไปกันเป็นแก๊ง');
  if (FREE_WORDS.test((spot.entryFee || '').trim()) || FREE_WORDS.test((spot.price || '').trim())) tags.push('ไม่เสียค่าเข้า');
  return tags.slice(0, 2);
}

/** Import markers that are not a vibe (structuredDataScraper) */
const NOT_A_VIBE = new Set(['นำเข้าจากเว็บไซต์']);

/** The one "#tag" a place card shows: staff's own tag first, else the first audience tag */
export function cardTag(spot: Parameters<typeof audienceTags>[0] & Pick<LifestyleSpotItem, 'vibeTags'>): string | undefined {
  return (spot.vibeTags || []).find((tag) => tag && !NOT_A_VIBE.has(tag)) ?? audienceTags(spot)[0];
}
