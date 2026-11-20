import type { LifestyleSpotItem } from '@/data/spotsData';
import { isThaiCoordinate } from '@/lib/contentQuality';
import { BEST_TIME, DEFAULT_LABELS, categorize } from './tourismDirectory';

/**
 * Attractions from the TAT Data API (docs/TAT_IMPORT.md, owner 2026-11-18): TAT's own text first, our vibe text later
 * for places that get recommended. Every place comes in as a draft for staff approval, credited to TAT
 * (`sourceName`, shown as "ข้อมูล: การท่องเที่ยวแห่งประเทศไทย" on the place page). Pictures keep TAT's links on dev; the
 * terms ask us to copy them to our storage, which happens when places are promoted to live.
 * The key allows 3,000 calls a day (shared by every clone), so callers pass a call budget.
 */
export const TAT_ORIGIN = 'https://tatdataapi.io';
export const TAT_SOURCE_NAME = 'การท่องเที่ยวแห่งประเทศไทย (TAT Data API)';
export const TAT_ATTRACTIONS = 3;
export const tatSourceUrl = (placeId: string | number) => `${TAT_ORIGIN}/api/v2/places/${placeId}`;

interface Named { name?: string | null }
export interface TatListPlace {
  placeId: string;
  name?: string;
  introduction?: string | null;
  category?: { categoryId?: number; name?: string };
  latitude?: string | number;
  longitude?: string | number;
  location?: { address?: string; province?: Named; district?: Named; subDistrict?: Named };
  thumbnailUrl?: string[] | string | null;
  sha?: { detail?: string | null; detailThumbnail?: string | null; detailPicture?: string[] | null } | null;
  tags?: string[];
  viewer?: number;
}
export interface TatDetail extends TatListPlace {
  category?: { categoryId?: number; name?: string; subCategories?: Named[] };
  information?: { introduction?: string | null; detail?: string | null; fee?: Record<string, number | null> | null; activities?: unknown[] };
  contact?: { phones?: string[]; mobiles?: string[]; urls?: string[] };
  desktopImageUrls?: string[] | null;
  mobileImageUrls?: string[] | null;
  googleMapUrl?: string | null;
  openingHours?: { dayRaw?: string; open?: string; close?: string }[] | null;
  specialCloseText?: string | null;
  facilities?: Named[] | null;
}

export class TatBudget {
  used = 0;
  constructor(readonly max: number) {}
  async get<T>(path: string): Promise<T> {
    if (this.used >= this.max) throw new Error(`TAT call budget of ${this.max} used up`);
    const key = process.env.TAT_API_KEY;
    if (!key) throw new Error('TAT_API_KEY is not set');
    this.used += 1;
    for (let attempt = 0; ; attempt += 1) {
      const res = await fetch(`${TAT_ORIGIN}${path}`, { headers: { 'x-api-key': key, 'Accept-Language': 'th', Accept: 'application/json' } });
      if (res.ok) return (await res.json()) as T;
      // TAT is sometimes busy: wait and try twice more, counting only the first call against the budget
      // 429: the day's quota is gone (other clones share it), so the run stops instead of trying every place
      if (res.status === 429 && attempt >= 1) throw new Error(`TAT call budget: quota reached (HTTP 429 on ${path})`);
      if (attempt >= 2 || (res.status !== 429 && res.status < 500)) throw new Error(`TAT ${path} → HTTP ${res.status}`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
    }
  }
}

/**
 * Every attraction in TAT's list. `categoryId` is ignored by the API (2026-11-18: every page holds all 20,159 places)
 * and pages come a few short of 1,000, so this walks every page by the total (about 21 calls) and keeps category 3.
 */
export async function listTatAttractions(budget: TatBudget): Promise<TatListPlace[]> {
  const seen = new Map<string, TatListPlace>();
  for (let page = 1; page <= 60; page += 1) {
    const body = await budget.get<{ data?: TatListPlace[]; pagination?: { total?: number; pageSize?: number } }>(`/api/v2/places?categoryId=${TAT_ATTRACTIONS}&limit=1000&page=${page}`);
    const rows = body.data ?? [];
    for (const row of rows) if (row.category?.categoryId === TAT_ATTRACTIONS && row.placeId) seen.set(String(row.placeId), row);
    if (rows.length === 0 || page * (body.pagination?.pageSize || 1000) >= (body.pagination?.total ?? 0)) break;
  }
  return [...seen.values()];
}

export const tatDetail = (budget: TatBudget, placeId: string) => budget.get<{ data?: TatDetail } & TatDetail>(`/api/v2/places/${encodeURIComponent(placeId)}`).then((body) => body.data ?? body);

const asList = (value: string[] | string | null | undefined): string[] => (Array.isArray(value) ? value : value ? [value] : []);
const httpsOnly = (url?: string | null) => (url && /^https:\/\//.test(url.trim()) ? url.trim() : '');

/** TAT text as plain Thai: tags out, entities decoded, doubled marks from typing slips ("มหาวิทยาลััย") folded */
export function cleanTatText(html?: string | null): string {
  return (html || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // &amp; last, so "&amp;lt;" stays the text "&lt;" instead of turning into "<" (CodeQL double unescaping)
    .replace(/&amp;/g, '&')
    .replace(/([ัิ-ฺ็-๎])\1+/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** The list already says whether a place has text and a picture worth opening details for */
export function listHasTextAndPicture(place: TatListPlace): boolean {
  const text = cleanTatText(place.introduction) || cleanTatText(place.sha?.detail);
  const picture = asList(place.thumbnailUrl).some((url) => httpsOnly(url)) || Boolean(httpsOnly(place.sha?.detailThumbnail));
  return text.length >= 40 && picture;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR: Record<string, string> = { monday: 'จ.', tuesday: 'อ.', wednesday: 'พ.', thursday: 'พฤ.', friday: 'ศ.', saturday: 'ส.', sunday: 'อา.' };
const hhmm = (value?: string) => (value && /^\d{1,2}:\d{2}/.test(value) ? value.slice(0, 5) : '');

/** "ทุกวัน 08:00-17:00 น." or "อ.-อา. 09:00-16:30 น." (days not listed are closed), the format lib/openHours.ts reads */
export function tatOpenHours(items?: TatDetail['openingHours']): string {
  const days = (items || [])
    .map((item) => ({ order: DAY_ORDER.indexOf((item.dayRaw || '').toLowerCase()), open: hhmm(item.open), close: hhmm(item.close) }))
    .filter((day) => day.order >= 0 && day.open && day.close)
    .sort((a, b) => a.order - b.order);
  if (days.length === 0) return 'ไม่ระบุ (โปรดตรวจสอบก่อนเดินทาง)';
  const hoursOf = (day: { open: string; close: string }) => (day.open === '00:00' && day.close === '23:59' ? 'เปิด 24 ชั่วโมง' : `${day.open}-${day.close} น.`);
  if (days.length === 7 && new Set(days.map(hoursOf)).size === 1) return hoursOf(days[0]) === 'เปิด 24 ชั่วโมง' ? 'เปิด 24 ชั่วโมง' : `ทุกวัน ${hoursOf(days[0])}`;
  const groups: { from: number; to: number; hours: string }[] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && last.hours === hoursOf(day) && last.to === day.order - 1) last.to = day.order;
    else groups.push({ from: day.order, to: day.order, hours: hoursOf(day) });
  }
  const name = (order: number) => DAY_ABBR[DAY_ORDER[order]];
  return groups.map((g) => `${g.from === g.to ? name(g.from) : `${name(g.from)}-${name(g.to)}`} ${g.hours}`).join(' · ');
}

function tatPrice(fee?: Record<string, number | null> | null): { price: string; entryFee?: string } {
  const thai = fee?.thaiAdult;
  const foreign = fee?.foreignerAdult;
  if (thai === 0 && (foreign === 0 || foreign == null)) return { price: 'เข้าชมฟรี', entryFee: 'เข้าชมฟรี' };
  if (typeof thai === 'number' && thai > 0) {
    const text = `ผู้ใหญ่ ${thai} บาท${typeof foreign === 'number' && foreign > thai ? ` (ชาวต่างชาติ ${foreign} บาท)` : ''}`;
    return { price: text, entryFee: text };
  }
  return { price: 'ไม่ระบุ' };
}

type Category = LifestyleSpotItem['category'];
/**
 * TAT's sub-categories, name by name (2026-11-18, all ~60 seen in the attractions). Matching words in them went wrong
 * ("เขื่อน พื้นที่อนุรักษ์ ทะเลสาบ" holds ทะเล, "แคมป์สัตว์" is no museum), so each is mapped; the vague ones
 * (landmarks, "อื่น ๆ") are left to the place's name.
 */
const TAT_SUBCATEGORY: Record<string, Category> = {
  'วัด': 'temple', 'สถานที่เกี่ยวกับศาสนาอื่นๆ': 'temple', 'สถานที่ศักดิ์สิทธิ์': 'temple', 'โบสถ์': 'temple', 'มัสยิด': 'temple', 'สถานปฏิบัติธรรม': 'temple',
  'อุทยานแห่งชาติ เขตรักษาพันธุ์สัตว์ป่า': 'nature', 'น้ำตก': 'nature', 'แหล่งท่องเที่ยวทางธรรมชาติอื่นๆ': 'nature', 'ท่องเที่ยวเชิงอนุรักษ์': 'nature',
  'ถ้ำ': 'nature', 'ธรรมชาติและสัตว์ป่า': 'nature', 'เขื่อน พื้นที่อนุรักษ์ ทะเลสาบ': 'nature', 'แม่น้ำลำคลอง': 'nature', 'น้ำพุร้อน': 'nature',
  'กิจกรรมกลางแจ้ง และกิจกรรมผจญภัย': 'nature',
  'พิพิธภัณฑ์': 'museum', 'พิพิธภัณฑ์เพื่อการศึกษา': 'museum', 'ห้องสมุด': 'museum', 'สถานที่ที่เกี่ยวข้องกับสงครามโลกครั้งที่ 2': 'museum',
  'สถานที่ท่องเที่ยวเชิงประวัติศาสตร์และอนุสาวรีย์': 'oldtown', 'แหล่งโบราณสถาน': 'oldtown', 'พระราชวัง': 'oldtown', 'บ้านโบราณ': 'oldtown',
  'ศิลปะ วัฒนธรรม แหล่งมรดก และสถาปัตยกรรม': 'oldtown', 'หมู่บ้าน ชุมชน': 'oldtown', 'วิถีชีวิต': 'oldtown',
  'อ่าวและชายหาด': 'beach', 'หมู่เกาะ': 'beach', 'จุดดำน้ำ': 'beach',
  'สวนและสวนสาธารณะ': 'park', 'สวนเพื่อการศึกษา': 'park', 'ทุ่งดอกไม้': 'park', 'โครงการหลวงและโครงการในพระราชดำริ': 'park',
  'ดอยและภูเขา': 'viewpoint',
  'ตลาดท้องถิ่น': 'market', 'ช้อปปิ้ง': 'market', 'ตลาดน้ำ': 'market', 'ตลาดกลางคืน': 'market', 'ตลาด': 'market',
  'ศูนย์ศิลปะและวัฒนธรรม': 'art', 'อาร์ตแกลเลอรี': 'art', 'การแสดงศิลปะและวัฒนธรรม': 'art', 'โรงละคร': 'art',
  'แคมป์สัตว์ และการแสดงสัตว์': 'attraction', 'สวนสัตว์ และพิพิธภัณฑ์สัตว์น้ำ': 'attraction', 'สวนสนุก': 'attraction', 'สันทนาการและบันเทิง': 'attraction',
  'สนามกีฬา': 'attraction', 'สนามกอล์ฟ': 'attraction', 'สปาเพื่อสุขภาพ': 'attraction', 'ไร่องุ่นและโรงงานเบียร์': 'attraction', 'โรงภาพยนตร์': 'attraction',
};

/** A name that starts with what the place is ("วัดชัยมงคล" filed by TAT under history first) settles it */
const TITLE_START: [RegExp, Category][] = [
  [/^(วัด|พระธาตุ|พระบรมธาตุ|ศาลเจ้า|ศาลหลักเมือง|มัสยิด|โบสถ์|อาสนวิหาร|สำนักสงฆ์)/, 'temple'],
  [/^(พิพิธภัณฑ์|หอศิลป์|หอจดหมายเหตุ)/, 'museum'],
  [/^(หาด|เกาะ|อ่าว)/, 'beach'],
  [/^(น้ำตก|ถ้ำ|อุทยานแห่งชาติ|เขื่อน|อ่างเก็บน้ำ|บึง|หนอง|น้ำพุร้อน|บ่อน้ำร้อน)/, 'nature'],
  [/^(จุดชมวิว|ดอย|ยอดเขา|ผา)/, 'viewpoint'],
  [/^(ตลาด|ถนนคนเดิน)/, 'market'],
  [/^สวนสาธารณะ/, 'park'],
];

/** Our category for a TAT attraction: a telling start of the name, else its first mapped sub-category, else the name's words */
export function tatCategory(title: string, detail: TatDetail | null, typeNames: string[] = []): Category {
  const byStart = TITLE_START.find(([pattern]) => pattern.test(title.trim()))?.[1];
  if (byStart) return byStart;
  for (const sub of detail?.category?.subCategories ?? []) {
    const mapped = TAT_SUBCATEGORY[(sub.name || '').trim()];
    if (mapped) return mapped;
  }
  return categorize(title, typeNames, false);
}

const stripAdminPrefix = (name: string) => name.replace(/^(เขต|อำเภอ|แขวง|ตำบล|กิ่งอำเภอ)\s*/, '').trim();

/** One TAT attraction as a draft place; null when it lacks a map point, a picture or real text */
export function tatToSpot(list: TatListPlace, detail: TatDetail | null): LifestyleSpotItem | null {
  const latitude = Number(detail?.latitude ?? list.latitude);
  const longitude = Number(detail?.longitude ?? list.longitude);
  if (!isThaiCoordinate(latitude, longitude)) return null;
  const title = cleanTatText(detail?.name || list.name).replace(/\s+/g, ' ');
  const province = cleanTatText((detail?.location ?? list.location)?.province?.name);
  if (title.length < 3 || !province) return null;

  const intro = cleanTatText(detail?.information?.introduction ?? list.introduction);
  const shaText = cleanTatText(list.sha?.detail ?? detail?.sha?.detail);
  const long = cleanTatText(detail?.information?.detail);
  // The introduction or SHA summary first; the long detail when nothing shorter exists, cut at a sentence near 900
  let description = intro || shaText || long;
  if (description.length > 900) {
    const cut = description.slice(0, 900);
    description = `${cut.slice(0, Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('\n'), 600)).trim()}…`;
  }
  if (description.length < 40) return null;

  const images = [...new Set([
    ...asList(detail?.desktopImageUrls),
    httpsOnly(list.sha?.detailThumbnail),
    ...asList(list.sha?.detailPicture),
    ...asList(list.thumbnailUrl),
    ...asList(detail?.mobileImageUrls),
  ].map(httpsOnly).filter(Boolean))].slice(0, 8);
  if (images.length === 0) return null;

  const typeNames = [...(detail?.category?.subCategories ?? []).map((s) => s.name || ''), ...(list.tags ?? [])].filter(Boolean);
  const category = tatCategory(title, detail, typeNames);
  const label = DEFAULT_LABELS[category];
  const district = stripAdminPrefix(cleanTatText((detail?.location ?? list.location)?.district?.name));
  const phone = [...(detail?.contact?.phones ?? []), ...(detail?.contact?.mobiles ?? [])].find(Boolean);
  const website = (detail?.contact?.urls ?? []).find((url) => /^https?:\/\//.test(url));
  const facilities = (detail?.facilities ?? []).map((f) => cleanTatText(f.name)).filter(Boolean).slice(0, 8);
  const subtype = (detail?.category?.subCategories ?? []).map((s) => cleanTatText(s.name)).find(Boolean);
  const openHours = tatOpenHours(detail?.openingHours);
  const special = cleanTatText(detail?.specialCloseText);
  return {
    id: `tat-${list.placeId}`,
    title,
    category,
    categoryLabel: label,
    province,
    district: district === province ? '' : district,
    image: images[0],
    galleryImages: images,
    openHours: special ? `${openHours} (${special})` : openHours,
    ...tatPrice(detail?.information?.fee),
    bestTime: BEST_TIME[category] || 'ในเวลาทำการ',
    vibeTags: [label, ...(subtype && subtype !== label ? [subtype] : [])],
    description,
    highlights: [],
    facilities,
    googleMapsUrl: httpsOnly(detail?.googleMapUrl) || `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    rating: 0,
    reviewsCount: 0,
    latitude,
    longitude,
    publicationStatus: 'draft',
    sourceName: TAT_SOURCE_NAME,
    sourceUrl: tatSourceUrl(list.placeId),
    ...(phone || website ? { contact: { ...(phone && { phone }), ...(website && { website }) } } : {}),
  };
}
