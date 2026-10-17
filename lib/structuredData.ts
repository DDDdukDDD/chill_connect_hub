import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { THAI_MONTHS_MAP, isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { isPriceFree } from '@/lib/priceUtils';
import { SITE_NAME, absoluteUrl, metaDescription } from '@/lib/site';

/**
 * schema.org JSON-LD for detail pages, so Google and AI search read the meetup, fair or place as data
 * (date, place, price) instead of guessing from the page text. Fields we do not know are left out, never guessed.
 */

type JsonLd = Record<string, unknown>;

/** For `<script type="application/ld+json">`: `<` escaped so text in the data cannot close the tag. */
export const jsonLdHtml = (data: JsonLd) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

const imageUrl = (src?: string) => (!src ? undefined : /^https?:\/\//.test(src) ? src : absoluteUrl(src));

const pad = (n: number) => String(n).padStart(2, '0');

/** "13 ต.ค. 2569" + "14:00" → "2026-10-13T14:00:00+07:00"; no time → the date alone. Null when the text names no month. */
function isoThaiDate(dateText: string | undefined, time: string | undefined, end: boolean): string | null {
  const text = (dateText || '').toLowerCase();
  if (!Object.keys(THAI_MONTHS_MAP).some((month) => text.includes(month))) return null;
  const day = new Date(end ? parseEventEndDateToTimestamp(text) : parseEventDateToTimestamp(text));
  const date = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  return time ? `${date}T${time}:00+07:00` : date;
}

/** "14:00 - 16:00 น." → ["14:00", "16:00"]; "ไม่ระบุเวลา" → []. */
const timesOf = (time?: string) => (time || '').match(/\b\d{1,2}[:.]\d{2}\b/g)?.map((t) => t.replace('.', ':').padStart(5, '0')) ?? [];

/** A meetup or a fair as a schema.org Event. Null when its date cannot be read (startDate is required). */
export function eventJsonLd(event: EventItem, path: string): JsonLd | null {
  const [startTime, endTime] = timesOf(event.time);
  const startDate = isoThaiDate(event.date, startTime, false);
  if (!startDate) return null;
  const endDate = isoThaiDate(event.endDate || event.date, endTime ?? (event.endDate ? undefined : startTime), true);
  const online = event.locationType === 'online';
  const free = isPriceFree(event.price);
  const image = imageUrl(event.image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title.replace(/^\[ตัวอย่าง\]\s*/, ''),
    description: metaDescription(event.description, 500),
    url: absoluteUrl(path),
    ...(image && { image: [image] }),
    startDate,
    ...(endDate && endDate !== startDate && { endDate }),
    eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url: absoluteUrl(path) }
      : {
          '@type': 'Place',
          name: event.location,
          address: { '@type': 'PostalAddress', addressLocality: event.province, addressCountry: 'TH' },
          ...(event.latitude != null && event.longitude != null && { geo: { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude } }),
        },
    ...(event.hostName && { organizer: { '@type': event.eventType === 'public_venue' ? 'Organization' : 'Person', name: event.hostName } }),
    ...(free && {
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'THB', url: absoluteUrl(path), availability: isEventEnded(event) ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
    }),
    ...(event.eventType === 'community' && event.maxParticipants > 0 && { maximumAttendeeCapacity: event.maxParticipants }),
  };
}

/** A published place as a schema.org TouristAttraction. Ratings are left out until they come from real visitors. */
export function placeJsonLd(spot: LifestyleSpotItem, path: string): JsonLd {
  const images = [spot.image, ...(spot.galleryImages ?? [])].map(imageUrl).filter(Boolean).slice(0, 5);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: spot.title,
    description: metaDescription(spot.description, 500),
    url: absoluteUrl(path),
    ...(images.length && { image: images }),
    address: { '@type': 'PostalAddress', addressLocality: spot.district || undefined, addressRegion: spot.province, addressCountry: 'TH' },
    ...(spot.latitude && spot.longitude && { geo: { '@type': 'GeoCoordinates', latitude: spot.latitude, longitude: spot.longitude } }),
    ...(spot.googleMapsUrl && { hasMap: spot.googleMapsUrl }),
    ...(spot.contact?.phone && { telephone: spot.contact.phone }),
    ...(spot.contact?.website && { sameAs: [spot.contact.website] }),
    ...(spot.entryFee ? { isAccessibleForFree: false } : isPriceFree(spot.price) ? { isAccessibleForFree: true } : {}),
    touristType: spot.categoryLabel,
  };
}

/** Home › list › this page, for the path shown under the title in search results. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: SITE_NAME, path: '/' }, ...items].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
