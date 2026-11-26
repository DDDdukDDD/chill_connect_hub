import { EventItem } from '@/data/mockData';
import { processRawEventWithAI } from './aiTagger';
import { fetchLiveRawEvents } from './eventScraper';
import { isDuplicateEvent } from './deduplication';
import { db, readDatabase, updateDatabase, paginateArray } from './db';
import { getCoreCommunityEvents } from './eventNormalization';
import { getAllDataSources, recordSourceScrape } from './sourcesStore';
import { scrapeEventSource } from './structuredDataScraper';
import { sanitizeRichHtml } from './safeHtml';
import { notifyReview } from './social/notifications';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import { PROVINCE_ALIASES } from './db/postgres/rows.mjs';
import { copyPosterToOwnMedia, eachLimited } from './media/posterCopy';
import { sql, USE_POSTGRES } from './db/postgres/client';

export { getCoreCommunityEvents };

export interface AdminEventItem extends EventItem {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  source?: string;
  sourceUrl?: string;
}

/**
 * Admin-facing event operations.
 * All event reads and writes go through the shared repository (`db`), which owns the
 * `events` key of chill_database.json; this module never writes events to disk itself.
 */

// Every event in every moderation state (admin moderation, deduplication)
export async function listAdminEvents(): Promise<AdminEventItem[]> {
  return (await db.listAllEvents()) as AdminEventItem[];
}

/**
 * Auto-publish lives in app.app_settings when there is a database (BE-479): the JSON store is per server on Vercel,
 * so the admin switch did not stick. Until staff first set it there, the bundled JSON value counts (false).
 */
const AUTO_PUBLISH_KEY = 'events_auto_publish';

export async function getAutoPublish(): Promise<boolean> {
  if (USE_POSTGRES) {
    const [row] = await sql()`select value from app.app_settings where key = ${AUTO_PUBLISH_KEY}`;
    if (row) return (row.value as { enabled?: boolean })?.enabled === true;
  }
  return Boolean((await readDatabase()).autoPublish);
}

export async function setAutoPublish(enabled: boolean) {
  if (USE_POSTGRES) {
    await sql()`insert into app.app_settings (key, value) values (${AUTO_PUBLISH_KEY}, ${sql().json({ enabled })})
                on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return;
  }
  await updateDatabase((data) => {
    data.autoPublish = enabled;
  });
}

export async function runScraperAndAIEngine(targetSource?: string): Promise<{
  newCount: number;
  duplicateCount: number;
  totalScanned: number;
  events: AdminEventItem[];
  duplicateDetails: { rawTitle: string; reason: string }[];
  sourceResults: Array<{ sourceId: string; sourceName: string; scanned: number; imported: number; duplicates: number; skipped: number; error?: string }>;
}> {
  const [currentEvents, autoPublish] = await Promise.all([listAdminEvents(), getAutoPublish()]);
  const normalizedTarget = targetSource?.trim().toLowerCase();
  const configuredSources = await getAllDataSources();
  const selectedSources = configuredSources.filter((source) =>
    source.targetType === 'events' &&
    source.status === 'active' &&
    (!normalizedTarget || source.id.toLowerCase() === normalizedTarget || source.name.toLowerCase().includes(normalizedTarget))
  );

  if (normalizedTarget && selectedSources.length === 0) {
    throw new Error(`No active Event source matches "${targetSource}"`);
  }

  const sourceScrapes: Awaited<ReturnType<typeof scrapeEventSource>>[] = [];
  for (let index = 0; index < selectedSources.length; index += 2) {
    const batch = selectedSources.slice(index, index + 2);
    sourceScrapes.push(...await Promise.all(batch.map((source) => scrapeEventSource({
      id: source.id,
      name: source.name,
      url: source.url,
      targetType: 'events',
    }))));
  }

  const newItems: AdminEventItem[] = [];
  const duplicateDetails: { rawTitle: string; reason: string }[] = [];
  const duplicatesBySource = new Map<string, number>();
  const importedBySource = new Map<string, number>();
  // Items without a known province or a place cannot be shown (form rules) and would fail the database's province check,
  // which used to abort the whole import (2026-11-23, BE-454). They are counted and left out.
  const skippedBySource = new Map<string, number>();
  const knownProvinces = new Set<string>(MASTER_77_PROVINCES);
  const showable = (e: { province?: string; location?: string }) =>
    Boolean(e.location?.trim()) && Boolean(e.province) && (knownProvinces.has(e.province!) || Boolean((PROVINCE_ALIASES as Record<string, string | null>)[e.province!]));

  for (const sourceScrape of sourceScrapes) {
    for (const raw of sourceScrape.items) {
      const currentCombined = [...newItems, ...currentEvents];
      const dupCheck = isDuplicateEvent(raw, currentCombined);

      if (dupCheck.isDuplicate) {
        duplicatesBySource.set(sourceScrape.sourceId, (duplicatesBySource.get(sourceScrape.sourceId) || 0) + 1);
        duplicateDetails.push({
          rawTitle: raw.rawTitle,
          reason: dupCheck.reason || 'ตรวจพบข้อมูลที่ซ้ำซ้อนกับในฐานข้อมูล',
        });
      } else {
        const processed = processRawEventWithAI(raw, newItems.length + 1);
        if (!showable(processed)) {
          skippedBySource.set(sourceScrape.sourceId, (skippedBySource.get(sourceScrape.sourceId) || 0) + 1);
          continue;
        }
        const adminItem: AdminEventItem = {
          ...processed,
          approvalStatus: autoPublish ? 'approved' : 'pending',
          source: sourceScrape.sourceName,
          sourceUrl: raw.sourceUrl,
        };
        newItems.push(adminItem);
        importedBySource.set(sourceScrape.sourceId, (importedBySource.get(sourceScrape.sourceId) || 0) + 1);
      }
    }
  }

  // Posters are kept on our own storage (BE-459); one that cannot be copied keeps its source link and is tried again
  // by the hourly poster job
  await eachLimited(newItems, 4, async (item) => {
    const own = await copyPosterToOwnMedia(item.image);
    if (own) item.image = own;
  });

  // Prepend new non-duplicate items through the repository (single writer for events)
  await db.createEvents(newItems);
  const updatedEvents = await listAdminEvents();

  await Promise.all(sourceScrapes.map((result) => recordSourceScrape(result.sourceId, {
    targetType: 'events',
    scannedCount: result.scannedCount,
    importedCount: importedBySource.get(result.sourceId) || 0,
    duplicateCount: duplicatesBySource.get(result.sourceId) || 0,
    errors: result.error ? [result.error] : [],
  })));

  return {
    newCount: newItems.length,
    duplicateCount: duplicateDetails.length,
    totalScanned: sourceScrapes.reduce((total, result) => total + result.scannedCount, 0),
    events: updatedEvents,
    duplicateDetails,
    sourceResults: sourceScrapes.map((result) => ({
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      scanned: result.scannedCount,
      imported: importedBySource.get(result.sourceId) || 0,
      duplicates: duplicatesBySource.get(result.sourceId) || 0,
      skipped: skippedBySource.get(result.sourceId) || 0,
      error: result.error,
    })),
  };
}


// Reset and seed database with BOTH Core Community Events AND Fresh Scraped Bangkok Events
export async function resetAndSeedAllEvents(): Promise<{ totalCount: number; events: AdminEventItem[] }> {
  // The database gets no sample ตี้ back (2026-11-24); the JSON store still starts with them
  const coreCommunityEvents = USE_POSTGRES ? [] : getCoreCommunityEvents();
  const rawEvents = await fetchLiveRawEvents();
  const allScrapedFresh: AdminEventItem[] = rawEvents.map((raw, idx) => ({
    ...processRawEventWithAI(raw, idx + 1),
    approvalStatus: 'approved' as const,
    source: raw.source,
    sourceUrl: raw.sourceUrl,
  }));

  // Always combine core community events with fresh scraped events
  const totalCount = await db.replaceAllEvents([...coreCommunityEvents, ...allScrapedFresh]);
  return { totalCount, events: await listAdminEvents() };
}

export async function updateEventApproval(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<AdminEventItem[]> {
  const before = await db.findEventById(id);
  await db.updateEvent(id, { approvalStatus: status, moderatedAt: Date.now() });
  if (before && before.approvalStatus !== status) await tellHost(before, status);
  return listAdminEvents();
}

/** The member who made a ตี้ hears when staff publish or turn it down */
export async function tellHost(event: EventItem, status: 'approved' | 'rejected' | 'pending', reason?: string) {
  const host = (event as { createdByMemberId?: string }).createdByMemberId;
  const path = `/${event.eventType === 'public_venue' ? 'events' : 'community'}/${encodeURIComponent(event.id)}`;
  if (host && status !== 'pending') await notifyReview(host, event.id, event.title, status, path, reason);
}

export async function approveAllPendingEvents(): Promise<AdminEventItem[]> {
  const moderatedAt = Date.now();
  const pending = (await listAdminEvents()).filter((ev) => ev.approvalStatus === 'pending');
  await db.bulkUpdateEvents(pending.map((ev) => ({ id: ev.id, data: { approvalStatus: 'approved', moderatedAt } })));
  for (const ev of pending) await tellHost(ev, 'approved');
  return listAdminEvents();
}

export async function deleteEvent(id: string): Promise<AdminEventItem[]> {
  await db.deleteEvent(id);
  return listAdminEvents();
}

export const deleteAdminEvent = deleteEvent;

export async function updateAdminEvent(id: string, updatedFields: Partial<AdminEventItem>): Promise<AdminEventItem[]> {
  // The id is the record key and cannot be changed through a field update
  const { id: _ignoredId, ...fields } = updatedFields;
  void _ignoredId;
  if (typeof fields.description === 'string') fields.description = sanitizeRichHtml(fields.description);
  await db.updateEvent(id, fields);
  return listAdminEvents();
}

export async function createAdminEvent(eventData: Omit<AdminEventItem, 'id'> & { id?: string }): Promise<AdminEventItem> {
  const created = await db.createEvent({
    ...eventData,
    // Descriptions come from the rich text editor as HTML; only plain formatting is stored
    ...(typeof eventData.description === 'string' && { description: sanitizeRichHtml(eventData.description) }),
    id: eventData.id || `admin-event-${Date.now()}`,
    approvalStatus: eventData.approvalStatus || 'approved',
    source: eventData.source || (eventData.eventType === 'public_venue' ? 'Admin Official' : 'Chill & Connect Community'),
    galleryImages: eventData.galleryImages && eventData.galleryImages.length > 0 ? eventData.galleryImages : [eventData.image],
    subActivities: eventData.subActivities || [],
  });
  return created as AdminEventItem;
}

// ── Admin moderation queries (server-side filtering & pagination) ──

export type AdminEventFormat = 'recurring' | 'online' | 'physical' | 'all';

export interface AdminEventQuery {
  type?: 'community' | 'public_venue' | 'all';
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  format?: AdminEventFormat;
  q?: string | null;
  page?: number;
  limit?: number;
}

export interface AdminEventCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recurring: number;
  online: number;
}

export function isOnlineEvent(ev: EventItem): boolean {
  return ev.locationType === 'online' || ev.province === 'ออนไลน์' || Boolean(ev.onlineJoinUrl);
}

export function isRecurringEvent(ev: EventItem): boolean {
  return ev.scheduleType === 'recurring' || Boolean(ev.recurrence);
}

const APPROVAL_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };

/**
 * Moderation list for one pillar: counts cover the whole pillar, items are filtered,
 * sorted pending-first (then newest) and paginated.
 */
export async function queryAdminEvents(query: AdminEventQuery) {
  const { type = 'all', status = 'all', format = 'all', q, page = 1, limit = 20 } = query;
  const scope = (await listAdminEvents()).filter((ev) => type === 'all' || ev.eventType === type);

  const counts: AdminEventCounts = {
    total: scope.length,
    pending: scope.filter((ev) => ev.approvalStatus === 'pending').length,
    approved: scope.filter((ev) => ev.approvalStatus === 'approved').length,
    rejected: scope.filter((ev) => ev.approvalStatus === 'rejected').length,
    recurring: scope.filter(isRecurringEvent).length,
    online: scope.filter(isOnlineEvent).length,
  };

  const search = q?.trim().toLowerCase();
  const filtered = scope
    .filter((ev) => status === 'all' || ev.approvalStatus === status)
    .filter((ev) => {
      if (format === 'recurring') return isRecurringEvent(ev);
      if (format === 'online') return isOnlineEvent(ev);
      if (format === 'physical') return !isOnlineEvent(ev);
      return true;
    })
    .filter((ev) => !search || [ev.title, ev.location, ev.hostName, ev.tag]
      .some((field) => field?.toLowerCase().includes(search)))
    .sort((a, b) =>
      (APPROVAL_ORDER[a.approvalStatus] ?? 3) - (APPROVAL_ORDER[b.approvalStatus] ?? 3) ||
      (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));

  return { ...paginateArray(filtered, page, limit), counts };
}
