import { EventItem } from '@/data/mockData';
import { processRawEventWithAI } from './aiTagger';
import { fetchLiveRawEvents } from './eventScraper';
import { isDuplicateEvent } from './deduplication';
import { db, readDatabase, updateDatabase } from './db';
import { getCoreCommunityEvents } from './eventNormalization';
import { getAllDataSources, recordSourceScrape } from './sourcesStore';
import { scrapeEventSource } from './structuredDataScraper';

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

export async function getAutoPublish(): Promise<boolean> {
  return Boolean((await readDatabase()).autoPublish);
}

export async function setAutoPublish(enabled: boolean) {
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
  sourceResults: Array<{ sourceId: string; sourceName: string; scanned: number; imported: number; duplicates: number; error?: string }>;
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
      error: result.error,
    })),
  };
}


// Reset and seed database with BOTH Core Community Events AND Fresh Scraped Bangkok Events
export async function resetAndSeedAllEvents(): Promise<{ totalCount: number; events: AdminEventItem[] }> {
  const coreCommunityEvents = getCoreCommunityEvents();
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
  await db.updateEvent(id, { approvalStatus: status, moderatedAt: Date.now() });
  return listAdminEvents();
}

export async function approveAllPendingEvents(): Promise<AdminEventItem[]> {
  const moderatedAt = Date.now();
  const pending = (await listAdminEvents()).filter((ev) => ev.approvalStatus === 'pending');
  await db.bulkUpdateEvents(pending.map((ev) => ({ id: ev.id, data: { approvalStatus: 'approved', moderatedAt } })));
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
  await db.updateEvent(id, fields);
  return listAdminEvents();
}

export async function createAdminEvent(eventData: Omit<AdminEventItem, 'id'> & { id?: string }): Promise<AdminEventItem> {
  const created = await db.createEvent({
    ...eventData,
    id: eventData.id || `admin-event-${Date.now()}`,
    approvalStatus: eventData.approvalStatus || 'approved',
    source: eventData.source || (eventData.eventType === 'public_venue' ? 'Admin Official' : 'Chill & Connect Community'),
    galleryImages: eventData.galleryImages && eventData.galleryImages.length > 0 ? eventData.galleryImages : [eventData.image],
    subActivities: eventData.subActivities || [],
  });
  return created as AdminEventItem;
}
