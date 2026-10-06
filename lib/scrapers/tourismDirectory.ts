import type { LifestyleSpotItem } from '@/data/spotsData';
import { htmlToText } from './html';
import type { SiteAdapterContext, SiteSpotAdapter, SpotScrapeOptions } from './types';

/**
 * Thailand Tourism Directory by the Department of Tourism (https://www.thailandtourismdirectory.go.th).
 * Official, nationwide and keyless:
 * - listing: the site's own search API `POST api.thailandtourismdirectory.go.th/api/v2/maininfo/search`
 *   (filter by province code and MainTypeID; 1 = attractions, 6 = restaurants)
 * - details: each place page is server-rendered with the full record in `__NEXT_DATA__`
 *   (images, Thai description, opening hours, fees, travel modes, facilities, activities, contacts).
 * Coverage note: strong for provincial nature/culture spots; thin for Bangkok and cafes.
 */

const API_ORIGIN = 'https://api.thailandtourismdirectory.go.th';
const SITE_ORIGIN = 'https://www.thailandtourismdirectory.go.th';
const SOURCE_NAME = 'กรมการท่องเที่ยว (Thailand Tourism Directory)';
const MAIN_TYPE_ATTRACTION = 1;
const MAIN_TYPE_RESTAURANT = 6;
const CAFE_KEYWORDS = ['คาเฟ่', 'กาแฟ', 'cafe', 'coffee'];
const MAX_LIST_RESULTS = 600;
const DETAIL_CONCURRENCY = 4;

type Localized = { th?: string; en?: string } | undefined;
interface SearchResult { ID: number; MainTypeID: number; ViewCount?: number; Name?: Localized }
interface SearchResponse { count?: number; sortedResults?: SearchResult[] }
interface NamedItem { th?: string; Name?: Localized; SubType?: { th?: string }; Quantity?: number }
interface OpeningHourItem { DayID: number; StartTime?: string; EndTime?: string; th?: { NameAbbr?: string } }
interface DirectoryRecord {
  ID: number;
  IntroImage?: string;
  Images?: string[];
  Name?: Localized;
  Detail?: Localized;
  TravelRemark?: Localized;
  Latitude?: number | string;
  Longitude?: number | string;
  District?: Localized;
  Province?: Localized;
  OpenHours?: { Items?: OpeningHourItem[] };
  TravelTypes?: { Items?: NamedItem[] };
  ViewCount?: number;
  Rating?: number;
  Telephone?: string;
  Mobile?: string;
  Website?: string;
  FacebookUrl?: string;
  Attraction?: {
    Info?: { HasCost?: number; CostThaiAdult?: number; CostThaiChild?: number; CostForeignAdult?: number; CostForeignChild?: number };
    Activities?: NamedItem[];
    Facilities?: NamedItem[];
    Utilities?: NamedItem[] | Record<string, unknown>;
    Types?: NamedItem[];
    StandardTypes?: NamedItem[];
  };
}

const th = (value: Localized) => (value?.th || '').trim();
const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
const asArray = <T,>(value: T[] | Record<string, unknown> | undefined): T[] => (Array.isArray(value) ? value : []);
const nameOf = (item: NamedItem) => (item.th || th(item.Name) || '').trim();

// The app stores Bangkok as "กรุงเทพฯ"; the source uses the official long name
const toSourceProvince = (name: string) => (name === 'กรุงเทพฯ' ? 'กรุงเทพมหานคร' : name);
const toAppProvince = (name: string) => (name === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : name);

let provinceCodes: Map<string, string> | null = null;

async function provinceCode(context: SiteAdapterContext, province: string): Promise<string> {
  if (!provinceCodes) {
    const list = await context.postJson(`${API_ORIGIN}/api/v2/lkup/provinces`, { Lang: 'th', RegionID: [] }) as Array<{ Code?: string; Details?: { th?: { Name?: string } } }>;
    if (!Array.isArray(list)) throw new Error('Tourism Directory province list was not an array');
    provinceCodes = new Map(list.filter((item) => item.Code && item.Details?.th?.Name).map((item) => [item.Details!.th!.Name!.trim(), item.Code!]));
  }
  const code = provinceCodes.get(toSourceProvince(province));
  if (!code) throw new Error(`Tourism Directory has no province named "${province}"`);
  return code;
}

async function searchAll(context: SiteAdapterContext, body: Record<string, unknown>): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (let skip = 0; skip < MAX_LIST_RESULTS; skip += 100) {
    const page = await context.postJson(`${API_ORIGIN}/api/v2/maininfo/search`, {
      Search: null, Skip: skip, Limit: 100, SubType: [], Lang: 'th', RegionID: [], AttractionTypes: '',
      SortBy: [{ field: 'updated_at', sort: 1 }], ...body,
    }) as SearchResponse;
    const batch = page.sortedResults || [];
    results.push(...batch);
    if (batch.length < 100 || results.length >= (page.count ?? 0)) break;
  }
  return results;
}

const byPopularity = (left: SearchResult, right: SearchResult) => (right.ViewCount || 0) - (left.ViewCount || 0);

async function fetchRecord(context: SiteAdapterContext, result: SearchResult): Promise<{ record: DirectoryRecord; url: string } | null> {
  const path = result.MainTypeID === MAIN_TYPE_RESTAURANT ? 'restaurants' : 'attraction';
  const url = `${SITE_ORIGIN}/${path}/${result.ID}`;
  const page = await context.fetchText(url);
  const match = page.text.match(/<script\b[^>]*id\s*=\s*["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i);
  if (!match) return null;
  const record = (JSON.parse(match[1]) as { props?: { pageProps?: { data?: DirectoryRecord } } }).props?.pageProps?.data;
  return record ? { record, url } : null;
}

async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await worker(items[index]);
    }
  }));
  return output;
}

// ── Mapping to the app's spot model ──

const CATEGORY_RULES: Array<[RegExp, LifestyleSpotItem['category']]> = [
  [/ทะเล|ชายหาด|หาด|เกาะ|อ่าว/, 'beach'],
  [/วัด|ศาสนสถาน|พระธาตุ|โบสถ์|มัสยิด|ศาลเจ้า|สำนักปฏิบัติธรรม/, 'temple'],
  [/พิพิธภัณฑ์/, 'museum'],
  [/หอศิลป|แกลเลอรี|หัตถกรรม|ผ้าทอ|งานศิลป์|ศิลปะร่วมสมัย|อาร์ต/, 'art'],
  [/ตลาด|ถนนคนเดิน|ช้อปปิ้ง|ห้างสรรพสินค้า|พลาซ่า|มอลล์/, 'market'],
  [/หมู่บ้าน|ชุมชน/, 'oldtown'],
  [/ภูเขา|ดอย|จุดชมวิว|ทะเลหมอก|ยอดเขา/, 'viewpoint'],
  [/น้ำตก|ถ้ำ|ป่า|อุทยาน|แหล่งน้ำ|ธรรมชาติ|ล่องแก่ง|เขื่อน|อ่างเก็บน้ำ|น้ำพุร้อน|แม่น้ำ|บึง/, 'nature'],
  [/สวนสาธารณะ|สวนสัตว์|สวนพฤกษ|สวนดอกไม้|สวน/, 'park'],
  [/ประวัติศาสตร์|โบราณ|วัฒนธรรม|ชุมชน|เมืองเก่า|อนุสาวรีย์|วัง|คุ้ม/, 'oldtown'],
];

export const DEFAULT_LABELS: Record<LifestyleSpotItem['category'], string> = {
  beach: 'ทะเล & ชายหาด', temple: 'วัด & ศาสนสถาน', museum: 'พิพิธภัณฑ์', art: 'ศิลปะ & งานคราฟต์', market: 'ตลาด & ถนนคนเดิน',
  viewpoint: 'จุดชมวิว & ภูเขา', nature: 'ธรรมชาติ & อุทยาน', park: 'สวน & พื้นที่สีเขียว', oldtown: 'ย่านเก่า & วิถีชุมชน',
  cafe: 'คาเฟ่ & ร้านกาแฟ', bar: 'บาร์', workspace: 'พื้นที่ทำงาน', coworking: 'Co-working',
};

// Generic visiting advice by kind of place; the source has no "best time" field
export const BEST_TIME: Partial<Record<LifestyleSpotItem['category'], string>> = {
  beach: 'ช่วงเช้า หรือเย็นก่อนพระอาทิตย์ตก',
  viewpoint: 'ช่วงเช้าตรู่ หรือช่วงเย็น',
  nature: 'ช่วงเช้า อากาศเย็นสบาย',
  park: 'ช่วงเช้า หรือช่วงเย็น',
  temple: 'ช่วงเช้าในเวลาทำการ',
  museum: 'ในเวลาทำการ วันธรรมดาคนน้อยกว่า',
  art: 'ในเวลาทำการ วันธรรมดาคนน้อยกว่า',
  oldtown: 'ช่วงเช้า หรือเย็นที่แดดไม่แรง',
  market: 'ตามวันและเวลาที่ตลาดเปิด',
  cafe: 'ช่วงสายถึงบ่าย',
};

/** Category from a place name alone (parenthesised park names ignored); undefined when the name says nothing */
export function categoryFromName(title: string): LifestyleSpotItem['category'] | undefined {
  const coreTitle = title.replace(/\([^)]*\)/g, ' ');
  return CATEGORY_RULES.find(([pattern]) => pattern.test(coreTitle))?.[1];
}

// The place name is more specific than the source's broad types ("ศิลปะและวัฒนธรรม"), so it is tried first
function categorize(title: string, typeNames: string[], isRestaurant: boolean): LifestyleSpotItem['category'] {
  if (isRestaurant) return 'cafe';
  // "น้ำตกวชิรธาร (อุทยานแห่งชาติดอยอินทนนท์)": the park in parentheses says nothing about the place itself
  const coreTitle = title.replace(/\([^)]*\)/g, ' ');
  const byTitle = CATEGORY_RULES.find(([pattern]) => pattern.test(coreTitle))?.[1];
  if (byTitle) return byTitle;
  return CATEGORY_RULES.find(([pattern]) => pattern.test(typeNames.join(' ')))?.[1] ?? 'nature';
}

// "แหล่งท่องเที่ยวประเภทชายหาด" → "ชายหาด"; generic umbrella types are dropped from labels
const GENERIC_TYPES = /^(ศิลปะและวัฒนธรรม|กิจกรรมและสันทนาการ|แหล่งท่องเที่ยวทางวัฒนธรรม|แหล่งท่องเที่ยวทางธรรมชาติ|แหล่งท่องเที่ยวทางประวัติศาสตร์)$/;
const cleanType = (name: string) => name.replace(/^แหล่งท่องเที่ยว(ประเภท|ทาง)?/, '').trim();

function bangkokTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })
    : null;
}

/** Opening hours like "เปิดทุกวัน 08:00-17:00 น." or "จ.-ศ. 08:30-16:30 น. · ส.-อา. 09:00-18:00 น." */
function formatOpenHours(items: OpeningHourItem[] | undefined): string {
  const days = (items || [])
    .map((item) => ({ order: item.DayID === 1 ? 8 : item.DayID, abbr: item.th?.NameAbbr || '', start: bangkokTime(item.StartTime), end: bangkokTime(item.EndTime) }))
    .filter((day) => day.abbr && day.start && day.end)
    .sort((left, right) => left.order - right.order);
  if (days.length === 0) return 'ไม่ระบุ (โปรดตรวจสอบก่อนเดินทาง)';
  const groups: Array<{ from: string; to: string; hours: string; lastOrder: number }> = [];
  for (const day of days) {
    // The source marks closed days as 00:00-00:00
    const hours = day.start === day.end ? 'ปิด' : `${day.start}-${day.end}`;
    const group = groups[groups.length - 1];
    if (group && group.hours === hours && group.lastOrder === day.order - 1) {
      group.to = day.abbr;
      group.lastOrder = day.order;
    } else {
      groups.push({ from: day.abbr, to: day.abbr, hours, lastOrder: day.order });
    }
  }
  const withUnit = (hours: string) => (hours === 'ปิด' ? hours : `${hours} น.`);
  if (groups.length === 1 && days.length === 7) return groups[0].hours === 'ปิด' ? 'ไม่ระบุ (โปรดตรวจสอบก่อนเดินทาง)' : `เปิดทุกวัน ${groups[0].hours} น.`;
  return groups.map((group) => `${group.from === group.to ? group.from : `${group.from}-${group.to}`} ${withUnit(group.hours)}`).join(' · ');
}

function formatFee(info: NonNullable<DirectoryRecord['Attraction']>['Info']): string | undefined {
  if (!info) return undefined;
  if (!info.HasCost) return 'เข้าชมฟรี';
  const part = (label: string, adult?: number, child?: number) => {
    const prices = [adult ? `ผู้ใหญ่ ${adult} บาท` : '', child ? `เด็ก ${child} บาท` : ''].filter(Boolean).join(' ');
    return prices ? `${label} ${prices}` : '';
  };
  return [part('คนไทย', info.CostThaiAdult, info.CostThaiChild), part('ต่างชาติ', info.CostForeignAdult, info.CostForeignChild)]
    .filter(Boolean).join(' · ') || 'มีค่าเข้าชม (ดูรายละเอียดที่แหล่งข้อมูล)';
}

const safeUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Coordinates drive maps and "nearby" features, so they must be real: inside Thailand's bounding box
 * and not a copy-paste error (the source has records with latitude == longitude or a negative latitude).
 */
export function isThaiCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 5.5 && latitude <= 20.6 && longitude >= 97.3 && longitude <= 105.7 &&
    latitude !== longitude;
}

export function mapDirectoryRecord(record: DirectoryRecord, sourceUrl: string, isRestaurant: boolean): LifestyleSpotItem | null {
  const title = th(record.Name).replace(/\s+/g, ' ');
  const province = toAppProvince(th(record.Province));
  const latitude = Number(record.Latitude);
  const longitude = Number(record.Longitude);
  const description = htmlToText(th(record.Detail)).slice(0, 700);
  if (title.length < 3 || !province || !isThaiCoordinate(latitude, longitude)) return null;
  if (description.length < 15) return null; // nothing useful to recommend

  const attraction = record.Attraction || {};
  const typeNames = unique([...asArray<NamedItem>(attraction.Types), ...asArray<NamedItem>(attraction.StandardTypes)].map(nameOf));
  // Thai labels only; the source mixes in English type names ("Festival/Event")
  const labelTypes = unique(typeNames.filter((name) => !GENERIC_TYPES.test(name) && /[\u0E00-\u0E7F]/.test(name)).map(cleanType));
  const activityNames = unique(asArray<NamedItem>(attraction.Activities).map((item) => item.SubType?.th || nameOf(item)));
  const category = categorize(title, typeNames, isRestaurant);
  const images = unique([record.IntroImage || '', ...(record.Images || [])]).filter((url) => /^https:\/\//.test(url));
  const travelModes = unique(asArray<NamedItem>(record.TravelTypes?.Items).map(nameOf));
  const travelRemark = htmlToText(th(record.TravelRemark)).slice(0, 200);
  const fee = isRestaurant ? undefined : formatFee(attraction.Info);
  const phone = unique([record.Telephone || '', record.Mobile || '']).join(', ');

  return {
    id: `ttd-${record.ID}`,
    title,
    category,
    categoryLabel: isRestaurant ? DEFAULT_LABELS.cafe : labelTypes.slice(0, 2).join(' · ') || DEFAULT_LABELS[category],
    province,
    district: th(record.District),
    transitInfo: [travelModes.length ? `เดินทางโดย ${travelModes.join(', ')}` : '', travelRemark].filter(Boolean).join(' · ') || undefined,
    image: images[0] || '',
    galleryImages: images.slice(0, 8),
    openHours: formatOpenHours(record.OpenHours?.Items),
    price: fee || 'ไม่ระบุ',
    entryFee: fee,
    bestTime: BEST_TIME[category] || 'ในเวลาทำการ',
    vibeTags: unique([...labelTypes, ...activityNames]).slice(0, 5),
    description,
    highlights: (activityNames.length ? activityNames : labelTypes).slice(0, 4),
    facilities: unique([...asArray<NamedItem>(attraction.Facilities), ...asArray<NamedItem>(attraction.Utilities)].map(nameOf)).slice(0, 8),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    // The source rating has no vote count (often a single vote), so it is not imported
    rating: 0,
    reviewsCount: 0,
    latitude,
    longitude,
    publicationStatus: 'draft',
    sourceName: SOURCE_NAME,
    sourceUrl,
    contact: phone || record.Website || record.FacebookUrl
      ? { phone: phone || undefined, website: safeUrl(record.Website), facebook: safeUrl(record.FacebookUrl) }
      : undefined,
    popularity: record.ViewCount || 0,
  };
}

export const tourismDirectoryAdapter: SiteSpotAdapter = {
  id: 'tourism-directory',
  matches: (url) => /(^|\.)thailandtourismdirectory\.go\.th$/i.test(url.hostname),
  async scrape(_sourceUrl, context, options: SpotScrapeOptions) {
    const code = await provinceCode(context, options.province);

    // Most-viewed attractions first; cafes are searched by keyword because restaurants are mostly not cafes
    const attractions = (await searchAll(context, { MainTypeID: [MAIN_TYPE_ATTRACTION], ProvinceCode: [code] })).sort(byPopularity);
    const cafeResults = new Map<number, SearchResult>();
    for (const keyword of CAFE_KEYWORDS) {
      for (const result of await searchAll(context, { Search: keyword, MainTypeID: [MAIN_TYPE_RESTAURANT], ProvinceCode: [code] })) {
        cafeResults.set(result.ID, result);
      }
    }
    const cafes = [...cafeResults.values()].sort(byPopularity);
    const selected = [...attractions.slice(0, options.limit), ...cafes.slice(0, Math.max(3, Math.ceil(options.limit / 5)))];

    const records = await mapLimit(selected, DETAIL_CONCURRENCY, async (result) => {
      try {
        return await fetchRecord(context, result);
      } catch {
        return null; // one broken page should not stop the province
      }
    });
    const items = records.flatMap((entry, index) => {
      if (!entry) return [];
      const spot = mapDirectoryRecord(entry.record, entry.url, selected[index].MainTypeID === MAIN_TYPE_RESTAURANT);
      return spot ? [spot] : [];
    });
    return { scannedCount: attractions.length + cafes.length, items };
  },
};
