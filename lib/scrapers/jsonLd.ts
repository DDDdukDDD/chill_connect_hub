import type { ScrapedRawEvent } from '@/lib/aiTagger';
import { bangkokTime, isoTimestamp, toThaiDisplayDate } from './dates';
import { decodeEntities, htmlToText } from './html';
import { getBlockedSourceReason } from './sourcePolicy';
import { thaiProvinceName } from './thaiProvinces';

/** Schema.org JSON-LD reading shared by the generic page reader and the site adapters. */

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
      documents.push(JSON.parse(match[2].replace(/^﻿/, '').trim()));
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

export function typeNames(node: Record<string, unknown>): string[] {
  const values = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  return values.filter((value): value is string => typeof value === 'string')
    .map((value) => value.split(/[\/#]/).pop()?.toLowerCase() || '');
}

export function textValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    return textValue(node.name || node['@id'] || node.url);
  }
  return '';
}

export function firstImage(value: unknown): string {
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
  // A bare country code ("TH") adds nothing to a Thai venue
  const addressParts = address && typeof address === 'object'
    ? [address.streetAddress, address.addressLocality, address.addressRegion, address.addressCountry].map(textValue).filter((part) => part && part !== 'TH')
    : [];
  return [textValue(location.name), ...addressParts].filter(Boolean).join(', ');
}

export function safeExternalUrl(value: unknown): string | undefined {
  const raw = textValue(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** One price, or the range over every offer ("฿2,000 - ฿6,900"); some sites put the country in priceCurrency. */
function offerPrice(value: unknown): string | undefined {
  const offers = (Array.isArray(value) ? value : [value]).filter((offer): offer is Record<string, unknown> => Boolean(offer) && typeof offer === 'object');
  const prices = offers.map((offer) => {
    const spec = offer.priceSpecification as Record<string, unknown> | undefined;
    return { price: textValue(offer.price || spec?.price), currency: textValue(offer.priceCurrency || spec?.priceCurrency) };
  }).filter((offer) => offer.price);
  if (prices.length === 0) return undefined;
  const numbers = prices.map((offer) => Number(offer.price)).filter((n) => Number.isFinite(n) && n > 0);
  const isBaht = prices.every((offer) => !offer.currency || /^(THB|TH|฿)$/i.test(offer.currency));
  if (isBaht && numbers.length === prices.length) {
    const baht = (n: number) => `฿${n.toLocaleString('en-US')}`;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return min === max ? baht(min) : `${baht(min)} - ${baht(max)}`;
  }
  return `${prices[0].currency} ${prices[0].price}`.trim();
}

/** Unique typed JSON-LD nodes of a page (or of a JSON-LD document). */
export function extractRecords(text: string, contentType: string): Record<string, unknown>[] {
  const unique = new Map<string, Record<string, unknown>>();
  for (const document of parseJsonLdDocuments(text, contentType)) {
    for (const node of collectJsonLdNodes(document)) {
      const key = textValue(node.url || node['@id']) || `${textValue(node.name)}:${typeNames(node).join(',')}`;
      if (key && typeNames(node).length) unique.set(key, node);
    }
  }
  return [...unique.values()];
}

export function isEventNode(node: Record<string, unknown>): boolean {
  return typeNames(node).some((type) => type === 'event' || type.endsWith('event') || type === 'eventseries');
}

/** English province names ("Bangkok") become the Thai names the app stores; anything else passes through. */
function provinceFrom(value: string): string | undefined {
  return value ? thaiProvinceName(value) || value : undefined;
}

/** Midnight start or end times ("2026-11-08T00:00:00.000Z") are date-only values written as timestamps. */
function withoutMidnight(value: string): string {
  return /T00:00(:00(\.0+)?)?(Z|[+-]00:?00)?$/.test(value) ? value.slice(0, 10) : value;
}

/**
 * Maps a Schema.org Event node to a raw event; null when the title, start date or location is missing.
 * `fallbackSource` names the source when the node has no organizer; `pageUrl` is used when the node has no URL.
 */
export function mapJsonLdEvent(record: Record<string, unknown>, pageUrl: URL, fallbackSource: string): ScrapedRawEvent | null {
  const rawTitle = decodeEntities(textValue(record.name));
  const rawDate = withoutMidnight(textValue(record.startDate));
  const rawLocation = eventLocation(record.location);
  if (rawTitle.length < 5 || !rawDate || !rawLocation) return null;

  const organizer = textValue(record.organizer);
  const location = record.location && typeof record.location === 'object' ? record.location as Record<string, unknown> : {};
  const address = location.address && typeof location.address === 'object' ? location.address as Record<string, unknown> : {};
  const geo = location.geo && typeof location.geo === 'object' ? location.geo as Record<string, unknown> : {};
  const latitude = Number(geo.latitude);
  const longitude = Number(geo.longitude);
  const sourceUrl = safeExternalUrl(record.url) || pageUrl.toString();
  if (getBlockedSourceReason(sourceUrl)) return null; // a listing that re-publishes Meetup/Facebook events
  const endValue = textValue(record.endDate);
  const rawEndDate = endValue ? withoutMidnight(endValue) : undefined;
  return {
    source: organizer || fallbackSource,
    sourceUrl,
    rawTitle,
    rawDate: toThaiDisplayDate(rawDate),
    rawEndDate: toThaiDisplayDate(rawEndDate),
    // 23:59 is "until the end of the day", not a real closing time
    rawTime: [bangkokTime(rawDate), bangkokTime(rawEndDate)].filter((time) => time && time !== '23:59').join(' - '),
    rawLocation,
    rawProvince: provinceFrom(textValue(address.addressRegion || address.addressLocality)),
    rawPrice: offerPrice(record.offers),
    rawDescription: htmlToText(textValue(record.description)),
    rawImage: firstImage(record.image),
    rawLatitude: Number.isFinite(latitude) ? latitude : undefined,
    rawLongitude: Number.isFinite(longitude) ? longitude : undefined,
  };
}

/** True when the event's last day (or its start, without an end) is before `now`. */
export function hasEnded(record: Record<string, unknown>, now: number): boolean {
  const end = withoutMidnight(textValue(record.endDate) || textValue(record.startDate));
  const timestamp = isoTimestamp(end, true);
  return timestamp !== null && timestamp < now;
}
