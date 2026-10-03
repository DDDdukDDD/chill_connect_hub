import { MOCK_EVENTS } from '@/data/mockData';
import type { AdminEventItem } from './eventsStore';
import { REAL_BANGKOK_EVENT_SEEDS } from './eventScraper';

const QSNCC_CALENDAR_URL = 'https://www.qsncc.com/en/whats-on/event-calendar';
const BITEC_GALLERY_URL = 'https://www.bitec.co.th/gallery';

// Helper: Get all protected core community events from mockData
export function getCoreCommunityEvents(): AdminEventItem[] {
  return MOCK_EVENTS.map((ev) => ({
    ...ev,
    eventType: ev.id.startsWith('comm-') ? 'community' : 'public_venue',
    approvalStatus: 'approved' as const,
    source: ev.id.startsWith('comm-') ? 'Chill & Connect Community' : 'Chill & Connect Official',
  }));
}

function withSourceUrl(ev: AdminEventItem, url: string): AdminEventItem {
  return { ...ev, externalUrl: url, link: url, sourceUrl: url };
}

// The official URL an event should link to: a matching seed's direct URL wins over venue-wide pages
function resolveOfficialUrl(ev: AdminEventItem): string | null {
  const seed = REAL_BANGKOK_EVENT_SEEDS.find(
    (s) => s.rawTitle === ev.title || ev.title.includes(s.rawTitle) || s.rawTitle.includes(ev.title)
  );
  if (seed?.sourceUrl) return seed.sourceUrl;
  if (ev.source === 'QSNCC Events' || ev.source === 'QSNCC' || ev.venueTag === 'qsncc' || (ev.location && ev.location.includes('สิริกิติ์'))) {
    return QSNCC_CALENDAR_URL;
  }
  if (ev.source === 'BITEC Events' || ev.source === 'BITEC Bangna' || ev.venueTag === 'bitec' || (ev.location && ev.location.includes('ไบเทค'))) {
    return BITEC_GALLERY_URL;
  }
  return null;
}

// Idempotent: normalizing an already-normalized event returns the same object
function normalizeEvent(ev: AdminEventItem): AdminEventItem {
  let next = ev;

  // 1. Auto-enrich events with direct official event URLs
  const officialUrl = resolveOfficialUrl(ev);
  if (officialUrl && ev.externalUrl !== officialUrl) {
    next = withSourceUrl(next, officialUrl);
  }

  // 2. Keep pillar identity consistent with the id prefix
  if (next.id?.startsWith('comm-')) {
    if (next.eventType !== 'community' || next.approvalStatus !== 'approved') {
      next = { ...next, eventType: 'community', approvalStatus: 'approved', source: 'Chill & Connect Community' };
    }
  } else if (next.id?.startsWith('pub-') || next.id?.startsWith('live-agg-')) {
    if (next.eventType !== 'public_venue') next = { ...next, eventType: 'public_venue' };
  }
  return next;
}

/**
 * Normalizes events loaded from storage and guarantees every core seed event exists.
 * Returns `changed: true` when the result differs from what was stored.
 */
export function normalizeStoredEvents(stored: AdminEventItem[]): { events: AdminEventItem[]; changed: boolean } {
  let changed = false;
  const normalized = stored.map((ev) => {
    const next = normalizeEvent(ev);
    if (next !== ev) changed = true;
    return next;
  });

  const existingIds = new Set(stored.map((e) => e.id));
  const missingCoreEvents = getCoreCommunityEvents().filter((ev) => !existingIds.has(ev.id));
  if (missingCoreEvents.length > 0) changed = true;

  return { events: [...missingCoreEvents, ...normalized], changed };
}
