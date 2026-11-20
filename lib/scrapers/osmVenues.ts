import type { LifestyleSpotItem } from '@/data/spotsData';
import { coordinatesMapUrl } from '@/lib/spotCategories';
import { OSM_VENUE_PREFIX } from '@/lib/spotPhotoRule';
import { BEST_TIME, DEFAULT_LABELS, isThaiCoordinate } from './tourismDirectory';

/**
 * Cafés, bakeries, bars and galleries from OpenStreetMap (owner 2026-11-19: our places were mostly temples).
 * OSM has names, pins, often hours and links, almost never a photo or a description. So every place comes in as a
 * draft with a plain description built only from its OSM tags (kind, district, Wi-Fi, outdoor seats), and it is
 * published only after a real photo is added (lib/spotPhotoRule.ts). Chain branches are left out.
 * Licence: OSM data is ODbL, so every place credits "OpenStreetMap" and links its OSM record.
 */

export const OSM_VENUE_SOURCE = 'OpenStreetMap';
const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  members?: { type: string; role: string; geometry?: { lat: number; lon: number }[] }[];
}

type Kind = { category: LifestyleSpotItem['category']; noun: string; tag?: string };
/** OSM tag → our category, the Thai noun the description starts with, and a second label for the vibe tags */
const KINDS: Record<string, Kind> = {
  'amenity=cafe': { category: 'cafe', noun: 'คาเฟ่' },
  'amenity=ice_cream': { category: 'cafe', noun: 'ร้านไอศกรีม', tag: 'ไอศกรีม & ของหวาน' },
  'shop=bakery': { category: 'cafe', noun: 'ร้านเบเกอรี่', tag: 'เบเกอรี่' },
  'shop=pastry': { category: 'cafe', noun: 'ร้านขนม', tag: 'เบเกอรี่' },
  'shop=coffee': { category: 'cafe', noun: 'ร้านกาแฟและเมล็ดกาแฟ' },
  'shop=tea': { category: 'cafe', noun: 'ร้านชา', tag: 'ร้านชา' },
  'amenity=bar': { category: 'bar', noun: 'บาร์' },
  'amenity=pub': { category: 'bar', noun: 'ผับ', tag: 'ผับ' },
  'amenity=biergarten': { category: 'bar', noun: 'สวนเบียร์', tag: 'ผับ' },
  'amenity=nightclub': { category: 'bar', noun: 'ไนต์คลับ', tag: 'ไนต์คลับ' },
  'tourism=gallery': { category: 'art', noun: 'แกลเลอรีศิลปะ', tag: 'แกลเลอรี' },
  'amenity=arts_centre': { category: 'art', noun: 'ศูนย์ศิลปะ', tag: 'แกลเลอรี' },
};

export function venueQuery(isoCode: string): string {
  return `[out:json][timeout:170];area["ISO3166-2"="${isoCode}"]->.p;(
nwr(area.p)["name"]["amenity"~"^(cafe|ice_cream|bar|pub|biergarten|nightclub|arts_centre)$"];
nwr(area.p)["name"]["shop"~"^(bakery|pastry|coffee|tea)$"];
nwr(area.p)["name"]["tourism"="gallery"];
);out tags center;`;
}

/** Malls, to name a chain branch after the one it sits in ("Starbucks สาขาสยามพารากอน") */
export const mallQuery = (isoCode: string) =>
  `[out:json][timeout:170];area["ISO3166-2"="${isoCode}"]->.p;nwr(area.p)["name"]["shop"="mall"];out tags center;`;

/** The nearest named mall within 200 m of a point, or '' */
export function mallLocator(malls: OsmElement[]) {
  const points = malls
    .map((m) => ({ name: (m.tags?.['name:th'] || m.tags?.name || '').trim(), lat: m.lat ?? m.center?.lat ?? NaN, lon: m.lon ?? m.center?.lon ?? NaN }))
    .filter((m) => m.name && Number.isFinite(m.lat) && Number.isFinite(m.lon));
  return (lat: number, lon: number): string => {
    let best = '';
    let bestMetres = 200;
    for (const m of points) {
      if (Math.abs(m.lat - lat) > 0.003 || Math.abs(m.lon - lon) > 0.003) continue;
      const d = Math.hypot((m.lat - lat) * 111_000, (m.lon - lon) * 111_000 * Math.cos((lat * Math.PI) / 180));
      if (d < bestMetres) [best, bestMetres] = [m.name, d];
    }
    return best;
  };
}

/** Districts (เขต/อำเภอ, admin level 6) with their outlines, to name the district of a place that does not say */
export const districtQuery = (isoCode: string) =>
  `[out:json][timeout:170];area["ISO3166-2"="${isoCode}"]->.p;relation["boundary"="administrative"]["admin_level"="6"](area.p);out geom;`;

export async function overpass(query: string): Promise<OsmElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'chillwaa-place-import/1.0' },
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const elements = ((await response.json()) as { elements?: OsmElement[] }).elements;
      if (Array.isArray(elements)) return elements;
    } catch (error) {
      lastError = error; // busy server: try the next one
    }
  }
  throw new Error(`Overpass query failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

const stripDistrict = (name: string) => name.replace(/^(เขต|อำเภอ|อ\.)\s*/, '').trim();

/**
 * District lookup by point in polygon. Every member way of a district relation is a list of edges; counting edge
 * crossings (even-odd) works without joining the ways into rings, and inner rings cancel out by themselves.
 */
export function districtLocator(relations: OsmElement[]) {
  const districts = relations
    .map((rel) => ({
      name: stripDistrict(rel.tags?.['name:th'] || rel.tags?.name || ''),
      ways: (rel.members ?? []).filter((m) => m.type === 'way' && m.geometry && m.geometry.length > 1).map((m) => m.geometry!),
    }))
    .filter((d) => d.name && d.ways.length);
  const boxes = districts.map((d) => {
    const pts = d.ways.flat();
    return { minLat: Math.min(...pts.map((p) => p.lat)), maxLat: Math.max(...pts.map((p) => p.lat)), minLon: Math.min(...pts.map((p) => p.lon)), maxLon: Math.max(...pts.map((p) => p.lon)) };
  });
  return (lat: number, lon: number): string => {
    for (let i = 0; i < districts.length; i += 1) {
      const box = boxes[i];
      if (lat < box.minLat || lat > box.maxLat || lon < box.minLon || lon > box.maxLon) continue;
      let inside = false;
      for (const way of districts[i].ways) {
        for (let j = 1; j < way.length; j += 1) {
          const a = way[j - 1];
          const b = way[j];
          if ((a.lat > lat) !== (b.lat > lat) && lon < ((b.lon - a.lon) * (lat - a.lat)) / (b.lat - a.lat) + a.lon) inside = !inside;
        }
      }
      if (inside) return districts[i].name;
    }
    return '';
  };
}

/** Branches of chains: everyone knows them and they would bury the independent places, so they come in only as meeting
 *  points and moment tags (`chainBrand`, owner 2026-11-19), never as cards on /spots */
const CHAIN_NAME = /starbucks|สตาร์บัคส์|amazon|อเมซอน|black canyon|แบล็คแคนยอน|s&p|coffee club|swensen|สเวนเซ่น|dairy queen|แดรี่ ควีน|mister donut|มิสเตอร์ โดนัท|dunkin|ดังกิ้น|tim hortons|au bon pain|inthanin|อินทนิล|punthai|พันธุ์ไทย|coffee world|doutor|tom n toms|chester|เชสเตอร์|true coffee|ทรู คอฟฟี่|bluekoff|cafe de norasingh|wawee|วาวี|7-?eleven|เซเว่น|lawson|family ?mart|hard rock|after you|อาฟเตอร์ ยู|mo-?mo-?paradise|baskin|บาสกิ้น|cold stone|häagen|haagen|cha ?tra ?mue|ชาตรามือ|ochaya|โอชายะ|koi th[eé]|kamu|คามุ/i;

/** The chain's name when this is a branch of one, else '' */
export function chainBrandOf(tags: Record<string, string>): string {
  const brand = (tags.brand || tags['brand:en'] || tags['brand:th'] || '').trim();
  if (brand) return brand;
  const named = `${tags.name || ''} ${tags['name:en'] || ''} ${tags['name:th'] || ''}`.match(CHAIN_NAME);
  return named ? named[0].trim() : tags['brand:wikidata'] ? (tags.name || '').trim() : '';
}

const DAY: Record<string, string> = { Mo: 'จ.', Tu: 'อ.', We: 'พ.', Th: 'พฤ.', Fr: 'ศ.', Sa: 'ส.', Su: 'อา.' };
export const UNKNOWN_HOURS = 'ไม่ระบุ (โปรดตรวจสอบก่อนเดินทาง)';

/** "Mo-Fr 08:00-18:00; Sa,Su 09:00-17:00" → "จ.-ศ. 08:00-18:00 · ส.,อา. 09:00-17:00"; anything fancier is "ไม่ระบุ" */
export function osmHours(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return UNKNOWN_HOURS;
  if (raw === '24/7') return 'เปิด 24 ชั่วโมง';
  const everyDay = raw.match(/^(?:Mo-Su )?(\d{1,2}:\d{2}-\d{1,2}:\d{2}(?:,\s*\d{1,2}:\d{2}-\d{1,2}:\d{2})*)$/);
  if (everyDay) return `ทุกวัน ${everyDay[1]}`;
  const text = raw
    .split(/\s*;\s*/)
    .filter(Boolean)
    .map((part) => part
      .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAY[d])
      .replace(/\bPH\b/g, 'วันหยุดนักขัตฤกษ์')
      .replace(/\b(off|closed)\b/gi, 'ปิด'))
    .join(' · ');
  // Months, "sunset", week numbers and the like: better say nothing than show half of it
  return /[A-Za-z]/.test(text) ? UNKNOWN_HOURS : text;
}

const httpsUrl = (value?: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:/i, 'https:');
  return /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v) ? `https://${v}` : '';
};
const socialUrl = (value: string | undefined, host: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:/i, 'https:');
  return /^@?[\w.]+$/.test(v) ? `https://www.${host}/${v.replace(/^@/, '')}` : '';
};

export function kindOf(tags: Record<string, string>): Kind | undefined {
  for (const key of ['amenity', 'shop', 'tourism']) {
    const kind = tags[key] && KINDS[`${key}=${tags[key]}`];
    if (kind) return kind;
  }
  return undefined;
}

/**
 * One OSM element as a place, or null when it is unnamed, unpinned or of another kind. Independent places are drafts
 * waiting for a photo; chain branches are published at once, hidden from browsing (curation override "hidden").
 */
export function osmToVenue(
  element: OsmElement,
  province: string,
  districtAt: (lat: number, lon: number) => string,
  mallAt: (lat: number, lon: number) => string = () => '',
): LifestyleSpotItem | null {
  const tags = element.tags ?? {};
  const kind = kindOf(tags);
  if (!kind) return null;
  const chainBrand = chainBrandOf(tags);
  const latitude = element.lat ?? element.center?.lat ?? NaN;
  const longitude = element.lon ?? element.center?.lon ?? NaN;
  if (!isThaiCoordinate(latitude, longitude)) return null;
  const district = stripDistrict(tags['addr:district'] || '') || districtAt(latitude, longitude);

  // A branch is told apart by its mall, street or district: 199 places named just "Starbucks" help nobody pick one
  const name = (tags.name || '').replace(/\s+/g, ' ').trim();
  const road = /^(ถนน|ถ\.)/.test(tags['addr:street'] || '') ? tags['addr:street'] : '';
  const branch = chainBrand && !/สาขา|branch/i.test(name) ? (tags.branch || mallAt(latitude, longitude) || road || (district && `เขต${district}`)).trim() : '';
  // "Starbucks Niche Pride Tao Poon" already names the brand: no "Starbucks สาขาStarbucks …"
  const title = !branch || name.includes(branch) ? name : branch.toLocaleLowerCase().includes(name.toLocaleLowerCase()) ? branch : `${name} สาขา${branch}`;
  if (title.length < 5) return null; // the site's rule for every place title

  const facilities = [
    /^(wlan|yes|wifi)$/i.test(tags.internet_access || '') && 'Wi-Fi',
    tags.outdoor_seating === 'yes' && 'ที่นั่งด้านนอก',
    tags.air_conditioning === 'yes' && 'ห้องแอร์',
    tags.wheelchair === 'yes' && 'รถเข็นเข้าได้',
    /^(yes|only)$/.test(tags['diet:vegan'] || '') && 'เมนูวีแกน',
  ].filter(Boolean) as string[];
  const street = tags['addr:street'] && /^(ถนน|ถ\.|ซอย|ซ\.)/.test(tags['addr:street']) ? tags['addr:street'] : '';
  // Facts from the tags only: no invented atmosphere (the vibe text is written when a photo comes in)
  const where = district ? `ย่าน${district}` : province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : `จังหวัด${province}`;
  const has = facilities.length ? ` มี${/^[A-Za-z]/.test(facilities[0]) ? ' ' : ''}${facilities.length > 1 ? `${facilities.slice(0, -1).join(' ')} และ${facilities.at(-1)}` : facilities[0]}` : '';
  const description = `${kind.noun}ใน${where}${street ? ` อยู่บน${street}` : ''}${has}`;

  const label = DEFAULT_LABELS[kind.category];
  const phone = (tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '').split(';')[0].trim();
  const website = httpsUrl(tags.website || tags['contact:website'] || tags.url) || socialUrl(tags['contact:instagram'] || tags.instagram, 'instagram.com');
  const facebook = socialUrl(tags['contact:facebook'] || tags.facebook, 'facebook.com');
  const titleEn = (tags['name:en'] || (/^[\x20-\x7E]+$/.test(title) ? title : '')).trim();

  return {
    id: `${OSM_VENUE_PREFIX}${element.type[0]}${element.id}`,
    title,
    ...(titleEn && { titleEn }),
    category: kind.category,
    categoryLabel: label,
    province,
    district: district === province ? '' : district,
    image: '',
    galleryImages: [],
    openHours: osmHours(tags.opening_hours),
    price: 'ไม่ระบุ',
    bestTime: kind.category === 'bar' ? 'ช่วงค่ำ' : BEST_TIME[kind.category] || 'ในเวลาทำการ',
    vibeTags: [label, ...(kind.tag ? [kind.tag] : [])],
    description,
    highlights: [],
    facilities,
    googleMapsUrl: coordinatesMapUrl(latitude, longitude),
    rating: 0,
    reviewsCount: 0,
    latitude,
    longitude,
    publicationStatus: chainBrand ? 'published' : 'draft',
    ...(chainBrand && {
      chainBrand,
      curation: { score: 0, tier: 'hidden' as const, reasons: ['สาขาร้านเครือ'], computedAt: new Date().toISOString(), override: 'hidden' as const, overrideNote: 'สาขาร้านเครือ: เป็นจุดนัดและสถานที่ในโมเมนต์ ไม่แสดงในหน้ารวม', overrideBy: 'import' },
    }),
    sourceName: OSM_VENUE_SOURCE,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    ...(phone || website || facebook ? { contact: { ...(phone && { phone }), ...(website && { website }), ...(facebook && { facebook }) } } : {}),
  };
}
