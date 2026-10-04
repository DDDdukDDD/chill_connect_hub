import type { LifestyleSpotItem } from '@/data/spotsData';
import { BEST_TIME, DEFAULT_LABELS, categoryFromName, isThaiCoordinate } from './tourismDirectory';
import { provinceIsoCode } from './thaiProvinces';
import type { SiteAdapterContext, SiteSpotAdapter, SpotScrapeOptions } from './types';

/**
 * Notable places from OpenStreetMap, enriched through Wikidata and Wikipedia.
 * OSM is dense in big cities (malls, museums, galleries, parks, markets) where the Tourism Directory is thin,
 * but it has no photos or descriptions. Only places linked to Wikidata are imported: their Wikipedia page
 * supplies the photo and the description, which keeps quality high (no stock photos, no invented text).
 * Licences: OSM data is ODbL and Wikipedia text is CC BY-SA, so every spot credits its sources.
 */

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const SOURCE_NAME = 'OpenStreetMap · Wikipedia';
const WIKIDATA_BATCH = 25;
const OVERPASS_TIMEOUT_MS = 70_000; // province area queries take 10-60 s

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface WikidataEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  sitelinks?: Record<string, { title: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>>;
}

interface WikiSummary {
  title?: string;
  extract?: string;
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

// OSM tag → app category and Thai label
function classify(tags: Record<string, string>, title: string): { category: LifestyleSpotItem['category']; label: string } | null {
  if (tags.shop === 'mall') return { category: 'market', label: 'ห้างสรรพสินค้า & ไลฟ์สไตล์มอลล์' };
  if (tags.amenity === 'marketplace') return { category: 'market', label: 'ตลาด' };
  switch (tags.tourism) {
    case 'museum': return { category: 'museum', label: 'พิพิธภัณฑ์' };
    case 'gallery': return { category: 'art', label: 'แกลเลอรี & หอศิลป์' };
    case 'viewpoint': return { category: 'viewpoint', label: 'จุดชมวิว' };
    case 'zoo': return { category: 'park', label: 'สวนสัตว์' };
    case 'aquarium': return { category: 'park', label: 'อควาเรียม' };
    case 'theme_park': return { category: 'park', label: 'สวนสนุก' };
    case 'attraction': {
      const category = categoryFromName(title);
      return category ? { category, label: DEFAULT_LABELS[category] } : { category: 'oldtown', label: 'แลนด์มาร์ก & สถานที่สำคัญ' };
    }
  }
  if (tags.leisure === 'park' || tags.leisure === 'garden') return { category: 'park', label: 'สวนสาธารณะ' };
  return null;
}

const DAY_NAMES: Record<string, string> = {
  Mo: 'จ.', Tu: 'อ.', We: 'พ.', Th: 'พฤ.', Fr: 'ศ.', Sa: 'ส.', Su: 'อา.', PH: 'วันหยุดนักขัตฤกษ์',
  Mon: 'จ.', Tue: 'อ.', Wed: 'พ.', Thu: 'พฤ.', Fri: 'ศ.', Sat: 'ส.', Sun: 'อา.',
};

/** OSM opening_hours ("Mo-Su 10:00-22:00") in Thai; unusual syntax is kept as-is rather than guessed */
function formatOpeningHours(value?: string): string {
  if (!value) return 'ไม่ระบุ (โปรดตรวจสอบก่อนเดินทาง)';
  if (value.trim() === '24/7') return 'เปิด 24 ชั่วโมง';
  const thai = value
    .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (day) => DAY_NAMES[day])
    .replace(/\boff\b/gi, 'ปิด')
    .replace(/;\s*/g, ' · ');
  return /\d/.test(thai) ? `${thai} น.` : thai;
}

const stripAdminPrefix = (name: string) => name.replace(/^(เขต|อำเภอ|แขวง|ตำบล|กิ่งอำเภอ)\s*/, '').trim();

// OSM objects are sometimes linked to the wrong Wikidata item (an aquarium tagged with its mall's id).
// Accept the link only when the names overlap.
const nameTokens = (value: string) => value.toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^\p{L}\p{M}\p{N}]+/u).filter((token) => token.length >= 3);
function namesMatch(osmNames: string[], wikiNames: string[]): boolean {
  const compact = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
  for (const osm of osmNames) {
    for (const wiki of wikiNames) {
      const a = compact(osm);
      const b = compact(wiki);
      if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;
      const shared = nameTokens(osm).filter((token) => nameTokens(wiki).includes(token));
      if (shared.length > 0) return true;
    }
  }
  return false;
}
const claimId = (entity: WikidataEntity, property: string) => {
  const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value as { id?: string } | undefined;
  return value?.id;
};
const claimString = (entity: WikidataEntity, property: string) => {
  const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : undefined;
};
const commonsFileUrl = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=1200`;

async function queryOverpass(context: SiteAdapterContext, isoCode: string): Promise<OsmElement[]> {
  const query = `[out:json][timeout:60];
area["ISO3166-2"="${isoCode}"]->.p;
(
  nwr(area.p)["wikidata"]["name"]["shop"="mall"];
  nwr(area.p)["wikidata"]["name"]["tourism"~"^(museum|gallery|attraction|viewpoint|zoo|aquarium|theme_park)$"];
  nwr(area.p)["wikidata"]["name"]["leisure"~"^(park|garden)$"];
  nwr(area.p)["wikidata"]["name"]["amenity"="marketplace"];
);
out center tags;`;
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await context.fetchText(`${endpoint}?data=${encodeURIComponent(query)}`, ['application/json'], OVERPASS_TIMEOUT_MS);
      const elements = (JSON.parse(response.text) as { elements?: OsmElement[] }).elements;
      if (Array.isArray(elements)) return elements;
    } catch (error) {
      lastError = error; // busy server: try the mirror
    }
  }
  throw new Error(`Overpass query failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

async function fetchEntities(context: SiteAdapterContext, ids: string[], props: string): Promise<Map<string, WikidataEntity>> {
  const entities = new Map<string, WikidataEntity>();
  for (let index = 0; index < ids.length; index += WIKIDATA_BATCH) {
    const batch = ids.slice(index, index + WIKIDATA_BATCH);
    const url = `${WIKIDATA_API}?action=wbgetentities&format=json&ids=${batch.join('|')}&props=${props}&languages=th|en&sitefilter=thwiki|enwiki`;
    const response = JSON.parse((await context.fetchText(url, ['application/json'])).text) as { entities?: Record<string, WikidataEntity> };
    for (const [id, entity] of Object.entries(response.entities || {})) entities.set(id, entity);
  }
  return entities;
}

async function fetchSummary(context: SiteAdapterContext, lang: 'th' | 'en', title: string): Promise<WikiSummary | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    return JSON.parse((await context.fetchText(url, ['application/json'])).text) as WikiSummary;
  } catch {
    return null;
  }
}

export const osmWikidataAdapter: SiteSpotAdapter = {
  id: 'osm-wikidata',
  matches: (url) => /(^|\.)openstreetmap\.org$/i.test(url.hostname),
  async scrape(_sourceUrl, context, options: SpotScrapeOptions) {
    const isoCode = provinceIsoCode(options.province);
    if (!isoCode) throw new Error(`Unknown province "${options.province}"`);

    const elements = (await queryOverpass(context, isoCode)).filter((element) => /^Q\d+$/.test(element.tags?.wikidata || ''));
    const qids = [...new Set(elements.map((element) => element.tags!.wikidata))];
    const entities = await fetchEntities(context, qids, 'labels|descriptions|sitelinks|claims');

    // Places with a Thai Wikipedia page first, then English, then the rest
    const rank = (entity?: WikidataEntity) => (entity?.sitelinks?.thwiki ? 2 : 0) + (entity?.sitelinks?.enwiki ? 1 : 0);
    const seen = new Set<string>();
    const candidates = elements
      .filter((element) => {
        const qid = element.tags!.wikidata;
        if (seen.has(qid) || rank(entities.get(qid)) === 0) return false;
        seen.add(qid);
        return true;
      })
      .sort((left, right) => rank(entities.get(right.tags!.wikidata)) - rank(entities.get(left.tags!.wikidata)))
      .slice(0, Math.ceil(options.limit * 1.5)); // some will lack a photo or text

    // District names from Wikidata "located in" (P131)
    const districtIds = [...new Set(candidates.map((element) => claimId(entities.get(element.tags!.wikidata)!, 'P131')).filter(Boolean) as string[])];
    const districts = districtIds.length ? await fetchEntities(context, districtIds, 'labels') : new Map<string, WikidataEntity>();

    const items: LifestyleSpotItem[] = [];
    for (const element of candidates) {
      if (items.length >= options.limit) break;
      const tags = element.tags!;
      const entity = entities.get(tags.wikidata)!;
      const latitude = element.lat ?? element.center?.lat ?? NaN;
      const longitude = element.lon ?? element.center?.lon ?? NaN;
      if (!isThaiCoordinate(latitude, longitude)) continue;

      const title = (tags['name:th'] || entity.labels?.th?.value || tags.name || '').trim();
      const osmNames = [tags.name, tags['name:th'], tags['name:en']].filter(Boolean) as string[];
      const wikiNames = [entity.labels?.th?.value, entity.labels?.en?.value, entity.sitelinks?.thwiki?.title, entity.sitelinks?.enwiki?.title].filter(Boolean) as string[];
      if (!namesMatch(osmNames, wikiNames)) continue;
      const kind = classify(tags, title);
      if (!kind || title.length < 3) continue;

      // Sequential summary requests (Wikimedia etiquette)
      const thTitle = entity.sitelinks?.thwiki?.title;
      const enTitle = entity.sitelinks?.enwiki?.title;
      // A sitelink can redirect to a broader article (Sea Life → Siam Paragon); keep only articles about this place
      const isAboutPlace = (candidate: WikiSummary | null) => Boolean(candidate?.extract && candidate.title && namesMatch(osmNames, [candidate.title]));
      let summary: WikiSummary | null = thTitle ? await fetchSummary(context, 'th', thTitle) : null;
      if (!isAboutPlace(summary)) summary = enTitle ? await fetchSummary(context, 'en', enTitle) : null;
      if (!isAboutPlace(summary)) summary = null;
      const description = (summary?.extract || entity.descriptions?.th?.value || '').replace(/\s+/g, ' ').trim().slice(0, 700);
      const p18 = claimString(entity, 'P18');
      const image = summary?.originalimage?.source || summary?.thumbnail?.source || (p18 ? commonsFileUrl(p18) : '');
      if (description.length < 15 || !image) continue; // no invented text, no stock photos

      const districtId = claimId(entity, 'P131');
      const districtName = districtId ? stripAdminPrefix(districts.get(districtId)?.labels?.th?.value || '') : '';
      // "Located in Bangkok" is the province, not a district
      const district = /^(กรุงเทพมหานคร|กรุงเทพฯ)$/.test(districtName) || districtName === options.province ? '' : districtName;
      const website = tags.website || tags['contact:website'] || claimString(entity, 'P856');
      const phone = tags.phone || tags['contact:phone'];
      const label = kind.label || 'แลนด์มาร์ก & สถานที่สำคัญ';

      items.push({
        id: `osm-${element.type[0]}${element.id}`,
        title,
        category: kind.category,
        categoryLabel: label,
        province: options.province,
        district,
        image,
        galleryImages: [image],
        openHours: formatOpeningHours(tags.opening_hours),
        price: tags.fee === 'no' ? 'เข้าชมฟรี' : 'ไม่ระบุ',
        entryFee: tags.fee === 'no' ? 'เข้าชมฟรี' : undefined,
        bestTime: BEST_TIME[kind.category] || 'ในเวลาทำการ',
        vibeTags: [label],
        description,
        highlights: entity.descriptions?.th?.value ? [entity.descriptions.th.value] : [],
        facilities: tags.wheelchair === 'yes' ? ['รองรับรถเข็นวีลแชร์'] : [],
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        rating: 0,
        reviewsCount: 0,
        latitude,
        longitude,
        publicationStatus: 'draft',
        sourceName: SOURCE_NAME,
        sourceUrl: summary?.content_urls?.desktop?.page || `https://www.openstreetmap.org/${element.type}/${element.id}`,
        contact: website || phone ? { website: website && /^https?:\/\//.test(website) ? website : undefined, phone } : undefined,
      });
    }
    return { scannedCount: elements.length, items };
  },
};
