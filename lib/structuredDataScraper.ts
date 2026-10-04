import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { LifestyleSpotItem } from '@/data/spotsData';
import { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, toThaiDisplayDate } from '@/lib/scrapers/dates';
import { findSiteEventAdapter } from '@/lib/scrapers/siteAdapters';
import { getBlockedSourceReason } from '@/lib/scrapers/sourcePolicy';
import { osmWikidataAdapter } from '@/lib/scrapers/osmWikidata';
import { tourismDirectoryAdapter } from '@/lib/scrapers/tourismDirectory';
import type { SiteAdapterContext, SiteSpotAdapter, SpotScrapeOptions } from '@/lib/scrapers/types';

export type ScrapeTarget = 'events' | 'spots';

export interface ScrapeSource {
  id: string;
  name: string;
  url: string;
  targetType: ScrapeTarget;
}

export interface SourceScrapeResult<T> {
  sourceId: string;
  sourceName: string;
  targetType: ScrapeTarget;
  scannedCount: number;
  items: T[];
  error?: string;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const ROBOTS_CACHE_MS = 15 * 60 * 1000;
const robotsCache = new Map<string, { expiresAt: number; rules: string | null }>();

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const parts = address.split('.').map(Number);
    const [first, second] = parts;
    return first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19 || second === 51)) ||
      (first === 203 && second === 0) ||
      (first === 192 && second === 0);
  }

  const normalized = address.toLowerCase();
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') || normalized.startsWith('fea') ||
    normalized.startsWith('feb') || normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
}

/** Accepts only public HTTPS URLs whose host resolves to public addresses (SSRF guard). */
export async function validatePublicHttpsUrl(value: string): Promise<URL> {
  return validateSourceUrl(value);
}

async function validateSourceUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') {
    throw new Error('Only public HTTPS source URLs are supported');
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || isIP(hostname)) {
    throw new Error('Private or local source hosts are not allowed');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error('Source host resolves to a private or reserved address');
  }
  return url;
}

function pathAllowedByRobots(rules: string | null, pathname: string): boolean {
  if (rules === null) return true;
  const groups: Array<{ agents: string[]; rules: Array<{ directive: string; path: string }> }> = [];
  let current: { agents: string[]; rules: Array<{ directive: string; path: string }> } | null = null;

  for (const rawLine of rules.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && value && current) {
      current.rules.push({ directive: key, path: value });
    }
  }

  const botName = 'chillconnecthubbot';
  const specificGroups = groups.filter((group) => group.agents.some((agent) => agent !== '*' && botName.includes(agent)));
  const matchingGroups = specificGroups.length ? specificGroups : groups.filter((group) => group.agents.includes('*'));
  const matching = matchingGroups.flatMap((group) => group.rules)
    .filter((rule) => pathname.startsWith(rule.path))
    .sort((left, right) => right.path.length - left.path.length || Number(right.directive === 'allow') - Number(left.directive === 'allow'))[0];
  return !matching || matching.directive === 'allow';
}

async function getRobotsRules(url: URL): Promise<string | null> {
  const cached = robotsCache.get(url.hostname);
  if (cached && cached.expiresAt > Date.now()) return cached.rules;

  const robotsUrl = new URL('/robots.txt', url.origin);
  await validateSourceUrl(robotsUrl.toString());
  const response = await fetch(robotsUrl, {
    headers: { 'User-Agent': 'ChillConnectHubBot/1.0' },
    redirect: 'error',
    signal: AbortSignal.timeout(4000),
  });

  if (response.status >= 500) throw new Error(`robots.txt returned ${response.status}`);
  const rules = response.ok ? await response.text() : null;
  robotsCache.set(url.hostname, { expiresAt: Date.now() + ROBOTS_CACHE_MS, rules });
  return rules;
}

const PAGE_TYPES = ['text/html', 'application/ld+json'];

/**
 * Public APIs that are meant for programmatic use but whose robots.txt keeps crawlers out of the API path.
 * Approved by the project owner (2026-10-04). Each is used under its own policy:
 * - Overpass (OpenStreetMap): fair use, one query per province run (https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)
 * - Wikidata Action API and Wikipedia REST page summaries: Wikimedia API etiquette and User-Agent policy,
 *   sequential requests (https://meta.wikimedia.org/wiki/User-Agent_policy)
 * Content from these sources must be credited (OSM / Wikipedia) where it is shown.
 */
const DOCUMENTED_PUBLIC_APIS: Array<{ host: RegExp; path: RegExp }> = [
  { host: /^(lz4\.|z\.)?overpass-api\.de$/, path: /^\/api\/interpreter$/ },
  { host: /^www\.wikidata\.org$/, path: /^\/w\/api\.php$/ },
  { host: /^(th|en)\.wikipedia\.org$/, path: /^\/api\/rest_v1\/page\/summary\// },
];
const API_USER_AGENT = 'ChillConnectHubBot/1.0 (prototype travel guide; https://github.com/DDDdukDDD/chill_connect_hub)';

function isDocumentedPublicApi(url: URL): boolean {
  return DOCUMENTED_PUBLIC_APIS.some((api) => api.host.test(url.hostname) && api.path.test(url.pathname));
}

interface GuardedRequest {
  acceptedTypes?: string[];
  /** Overrides the default timeout (slow APIs such as Overpass area queries) */
  timeoutMs?: number;
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
}

/**
 * The single network path of the scraper: public HTTPS only (SSRF guard), blocked platforms,
 * robots.txt, manual redirects (each hop revalidated, GET only), response type, size and time limits.
 */
async function fetchSourceDocument(value: string, request: GuardedRequest = {}, redirectCount = 0): Promise<{ url: URL; text: string; contentType: string }> {
  if (redirectCount > 2) throw new Error('Source redirected too many times');
  const acceptedTypes = request.acceptedTypes || PAGE_TYPES;
  const url = await validateSourceUrl(value);
  // Checked on every hop so a redirect cannot lead into a blocked platform
  const blockedReason = getBlockedSourceReason(url);
  if (blockedReason) throw new Error(blockedReason);
  // Documented public APIs are used under their own API policies; robots.txt still applies to every other URL
  const documentedApi = isDocumentedPublicApi(url);
  if (!documentedApi) {
    const robotsRules = await getRobotsRules(url);
    if (!pathAllowedByRobots(robotsRules, url.pathname)) {
      throw new Error('Source path is disallowed by robots.txt');
    }
  }

  const response = await fetch(url, {
    method: request.method || 'GET',
    body: request.body,
    headers: {
      Accept: acceptedTypes.join(', '),
      'User-Agent': documentedApi ? API_USER_AGENT : 'ChillConnectHubBot/1.0',
      ...request.headers,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(request.timeoutMs ?? FETCH_TIMEOUT_MS),
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Source returned a redirect without a location');
    if (request.method === 'POST') throw new Error('Source API redirected a POST request');
    return fetchSourceDocument(new URL(location, url).toString(), request, redirectCount + 1);
  }
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!acceptedTypes.some((type) => contentType.includes(type))) {
    throw new Error(`Source returned ${contentType || 'an unknown type'}, expected ${acceptedTypes.join(' or ')}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_RESPONSE_BYTES) throw new Error('Source response exceeds 2 MB');
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) throw new Error('Source response exceeds 2 MB');
  return { url, text, contentType };
}

const adapterContext = (): SiteAdapterContext => ({
  fetchText: (url, acceptedTypes, timeoutMs) => fetchSourceDocument(url, { acceptedTypes, timeoutMs }),
  postJson: async (url, body, headers) => {
    const { text } = await fetchSourceDocument(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers },
      acceptedTypes: ['application/json'],
    });
    return JSON.parse(text);
  },
  now: Date.now(),
});

function parseJsonLdDocuments(text: string, contentType: string): unknown[] {
  if (contentType.includes('application/ld+json')) {
    try {
      return [JSON.parse(text)];
    } catch {
      return [];
    }
  }

  const documents: unknown[] = [];
  const scriptPattern = /<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script\s*>/gi;
  for (const match of text.matchAll(scriptPattern)) {
    try {
      documents.push(JSON.parse(match[2].replace(/^\uFEFF/, '').trim()));
    } catch {
      // Ignore malformed JSON-LD blocks but continue processing the page.
    }
  }
  return documents;
}

function collectJsonLdNodes(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, output);
    return output;
  }
  if (!value || typeof value !== 'object') return output;

  const node = value as Record<string, unknown>;
  output.push(node);
  for (const key of ['@graph', 'itemListElement', 'item', 'mainEntity', 'mainEntityOfPage']) {
    if (key in node) collectJsonLdNodes(node[key], output);
  }
  return output;
}

function typeNames(node: Record<string, unknown>): string[] {
  const values = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  return values.filter((value): value is string => typeof value === 'string')
    .map((value) => value.split(/[\/#]/).pop()?.toLowerCase() || '');
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    return textValue(node.name || node['@id'] || node.url);
  }
  return '';
}

function firstImage(value: unknown): string {
  if (Array.isArray(value)) return firstImage(value[0]);
  if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    return textValue(node.url || node.contentUrl);
  }
  return typeof value === 'string' ? value.trim() : '';
}

function eventLocation(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const location = value as Record<string, unknown>;
  const address = location.address as Record<string, unknown> | string | undefined;
  if (typeof address === 'string') return [textValue(location.name), address.trim()].filter(Boolean).join(', ');
  const addressParts = address && typeof address === 'object'
    ? [address.streetAddress, address.addressLocality, address.addressRegion, address.addressCountry].map(textValue).filter(Boolean)
    : [];
  return [textValue(location.name), ...addressParts].filter(Boolean).join(', ');
}

function safeExternalUrl(value: unknown): string | undefined {
  const raw = textValue(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function offerPrice(value: unknown): string | undefined {
  const offer = Array.isArray(value) ? value[0] : value;
  if (!offer || typeof offer !== 'object') return undefined;
  const node = offer as Record<string, unknown>;
  const price = textValue(node.price || (node.priceSpecification as Record<string, unknown> | undefined)?.price);
  const currency = textValue(node.priceCurrency || (node.priceSpecification as Record<string, unknown> | undefined)?.priceCurrency);
  return price ? `${currency} ${price}`.trim() : undefined;
}

function extractRecords(text: string, contentType: string): Record<string, unknown>[] {
  const unique = new Map<string, Record<string, unknown>>();
  for (const document of parseJsonLdDocuments(text, contentType)) {
    for (const node of collectJsonLdNodes(document)) {
      const key = textValue(node.url || node['@id']) || `${textValue(node.name)}:${typeNames(node).join(',')}`;
      if (key && typeNames(node).length) unique.set(key, node);
    }
  }
  return [...unique.values()];
}

function isEventNode(node: Record<string, unknown>): boolean {
  return typeNames(node).some((type) => type === 'event' || type.endsWith('event') || type === 'eventseries');
}

const PLACE_TYPES = new Set([
  'place', 'localbusiness', 'touristattraction', 'park', 'cafeorcoffeeshop',
  'restaurant', 'foodestablishment', 'museum', 'artgallery', 'barorpub', 'store',
  'shoppingcenter', 'sportsactivitylocation', 'landmarksorhistoricalbuildings',
]);

function isPlaceNode(node: Record<string, unknown>): boolean {
  return typeNames(node).some((type) => PLACE_TYPES.has(type));
}

export async function scrapeEventSource(source: ScrapeSource): Promise<SourceScrapeResult<ScrapedRawEvent>> {
  try {
    // Site-specific readers for pages without JSON-LD
    const adapter = findSiteEventAdapter(source.url);
    if (adapter) {
      const result = await adapter.scrape(new URL(source.url), adapterContext());
      if (result.scannedCount === 0) throw new Error('The source listed no events');
      return {
        sourceId: source.id,
        sourceName: source.name,
        targetType: 'events',
        scannedCount: result.scannedCount,
        items: result.items.filter((item) => !getBlockedSourceReason(item.sourceUrl)),
      };
    }

    const { url, text } = await fetchSourceDocument(source.url);
    const contentType = text.trimStart().startsWith('{') ? 'application/ld+json' : 'text/html';
    const records = extractRecords(text, contentType).filter(isEventNode);
    if (records.length === 0) throw new Error('No Schema.org Event JSON-LD found on this page');
    const items = records.flatMap((record) => {
      const rawTitle = textValue(record.name);
      const rawDate = textValue(record.startDate);
      const rawLocation = eventLocation(record.location);
      if (rawTitle.length < 5 || !rawDate || !rawLocation) return [];

      const organizer = textValue(record.organizer);
      const image = firstImage(record.image);
      const location = record.location && typeof record.location === 'object' ? record.location as Record<string, unknown> : {};
      const address = location.address && typeof location.address === 'object' ? location.address as Record<string, unknown> : {};
      const geo = location.geo && typeof location.geo === 'object' ? location.geo as Record<string, unknown> : {};
      const latitude = Number(geo.latitude);
      const longitude = Number(geo.longitude);
      const sourceUrl = safeExternalUrl(record.url) || url.toString();
      if (getBlockedSourceReason(sourceUrl)) return []; // a listing that re-publishes Meetup/Facebook events
      const rawEndDate = textValue(record.endDate) || undefined;
      return [{
        source: organizer || source.name,
        sourceUrl,
        rawTitle,
        rawDate: toThaiDisplayDate(rawDate),
        rawEndDate: toThaiDisplayDate(rawEndDate),
        rawTime: [bangkokTime(rawDate), bangkokTime(rawEndDate)].filter(Boolean).join(' - '),
        rawLocation,
        rawProvince: textValue(address.addressRegion || address.addressLocality) || undefined,
        rawPrice: offerPrice(record.offers),
        rawDescription: textValue(record.description),
        rawImage: image,
        rawLatitude: Number.isFinite(latitude) ? latitude : undefined,
        rawLongitude: Number.isFinite(longitude) ? longitude : undefined,
      }];
    });
    if (items.length === 0) throw new Error(`Found ${records.length} Event records, but none had a title, start date, and location`);
    return { sourceId: source.id, sourceName: source.name, targetType: 'events', scannedCount: records.length, items };
  } catch (error) {
    return { sourceId: source.id, sourceName: source.name, targetType: 'events', scannedCount: 0, items: [], error: error instanceof Error ? error.message : 'Source fetch failed' };
  }
}

function placeCategory(types: string[]): LifestyleSpotItem['category'] {
  if (types.some((type) => type.includes('cafe') || type.includes('restaurant') || type.includes('bar'))) return 'cafe';
  if (types.some((type) => type.includes('museum') || type.includes('gallery'))) return 'art';
  if (types.some((type) => type.includes('park') || type.includes('touristattraction'))) return 'nature';
  return 'nature';
}

function openingHoursValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value.map((item) => {
    if (!item || typeof item !== 'object') return '';
    const spec = item as Record<string, unknown>;
    return [textValue(spec.dayOfWeek), textValue(spec.opens), textValue(spec.closes)].filter(Boolean).join(' ');
  }).filter(Boolean).join('; ');
}

const SITE_SPOT_ADAPTERS: SiteSpotAdapter[] = [tourismDirectoryAdapter, osmWikidataAdapter];

export function isProvinceSpotSource(sourceUrl: string): boolean {
  try {
    const url = new URL(sourceUrl);
    return SITE_SPOT_ADAPTERS.some((adapter) => adapter.matches(url));
  } catch {
    return false;
  }
}

export async function scrapeSpotSource(source: ScrapeSource, options?: SpotScrapeOptions): Promise<SourceScrapeResult<LifestyleSpotItem>> {
  try {
    // Site adapters import one province per run
    const sourceUrl = new URL(source.url);
    const adapter = SITE_SPOT_ADAPTERS.find((candidate) => candidate.matches(sourceUrl));
    if (adapter) {
      if (!options?.province) throw new Error('เลือกจังหวัดก่อนสแกนแหล่งข้อมูลนี้');
      const result = await adapter.scrape(sourceUrl, adapterContext(), options);
      return { sourceId: source.id, sourceName: source.name, targetType: 'spots', scannedCount: result.scannedCount, items: result.items };
    }

    const { url, text } = await fetchSourceDocument(source.url);
    const contentType = text.trimStart().startsWith('{') ? 'application/ld+json' : 'text/html';
    const records = extractRecords(text, contentType).filter(isPlaceNode);
    if (records.length === 0) throw new Error('No supported Schema.org Place JSON-LD found on this page');
    const items = records.flatMap((record) => {
      const title = textValue(record.name);
      const address = record.address && typeof record.address === 'object' ? record.address as Record<string, unknown> : {};
      const province = textValue(address.addressRegion || address.addressLocality);
      const district = textValue(address.addressLocality || address.addressSubLocality);
      const geo = record.geo && typeof record.geo === 'object' ? record.geo as Record<string, unknown> : {};
      const latitude = Number(geo.latitude);
      const longitude = Number(geo.longitude);
      const description = textValue(record.description);
      if (title.length < 5 || province.length < 2 || !Number.isFinite(latitude) || !Number.isFinite(longitude) || description.length < 15) return [];

      const category = placeCategory(typeNames(record));
      const image = firstImage(record.image);
      const sourceUrl = safeExternalUrl(record.url) || url.toString();
      const aggregateRating = record.aggregateRating && typeof record.aggregateRating === 'object'
        ? record.aggregateRating as Record<string, unknown>
        : {};
      const rating = Number(aggregateRating.ratingValue);
      const reviewsCount = Number(aggregateRating.reviewCount || aggregateRating.ratingCount);
      const id = createHash('sha256').update(`${source.id}:${sourceUrl}`).digest('hex').slice(0, 24);

      return [{
        id: `scraped-${id}`,
        title,
        category,
        categoryLabel: category,
        province,
        district,
        image,
        galleryImages: image ? [image] : [],
        openHours: openingHoursValue(record.openingHours || record.openingHoursSpecification) || 'ไม่ระบุ',
        price: 'ไม่ระบุ',
        bestTime: 'ไม่ระบุ',
        vibeTags: ['นำเข้าจากเว็บไซต์'],
        description,
        highlights: [],
        facilities: [],
        googleMapsUrl: safeExternalUrl(record.hasMap) || sourceUrl,
        rating: Number.isFinite(rating) ? rating : 0,
        reviewsCount: Number.isFinite(reviewsCount) ? reviewsCount : 0,
        latitude,
        longitude,
        publicationStatus: 'draft' as const,
        sourceName: source.name,
        sourceUrl,
      }];
    });
    if (items.length === 0) throw new Error(`Found ${records.length} Place records, but none had a title, province, coordinates, and description`);
    return { sourceId: source.id, sourceName: source.name, targetType: 'spots', scannedCount: records.length, items };
  } catch (error) {
    return { sourceId: source.id, sourceName: source.name, targetType: 'spots', scannedCount: 0, items: [], error: error instanceof Error ? error.message : 'Source fetch failed' };
  }
}
