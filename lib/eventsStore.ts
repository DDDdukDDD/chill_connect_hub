import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { processRawEventWithAI } from './aiTagger';
import { fetchLiveRawEvents, REAL_BANGKOK_EVENT_SEEDS } from './eventScraper';
import { isDuplicateEvent } from './deduplication';
import { readDatabase, writeDatabase } from './db';

export interface AdminEventItem extends EventItem {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  source?: string;
  sourceUrl?: string;
}

// In-memory cache synced with disk database
let MEMORY_CACHE: AdminEventItem[] | null = null;
let AUTO_PUBLISH_ENABLED: boolean = false;

// Ensure database is loaded into cache
export async function loadCache(): Promise<AdminEventItem[]> {
  if (MEMORY_CACHE !== null && MEMORY_CACHE.length > 0) {
    return MEMORY_CACHE;
  }
  const db = await readDatabase();
  AUTO_PUBLISH_ENABLED = db.autoPublish;
  MEMORY_CACHE = db.events;
  return MEMORY_CACHE;
}

export function getAllAdminEvents(): AdminEventItem[] {
  if (MEMORY_CACHE && MEMORY_CACHE.length > 0) {
    return MEMORY_CACHE;
  }
  return MOCK_EVENTS.map((ev) => ({
    ...ev,
    approvalStatus: 'approved' as const,
    source: 'Chill & Connect Official',
  }));
}

export function getApprovedPublicEvents(): EventItem[] {
  const all = getAllAdminEvents();
  return all.filter((ev) => ev.approvalStatus === 'approved');
}

export async function setAutoPublish(enabled: boolean) {
  AUTO_PUBLISH_ENABLED = enabled;
  const db = await readDatabase();
  db.autoPublish = enabled;
  await writeDatabase(db);
}

export function isAutoPublishEnabled(): boolean {
  return AUTO_PUBLISH_ENABLED;
}

export async function runScraperAndAIEngine(): Promise<{
  newCount: number;
  duplicateCount: number;
  events: AdminEventItem[];
  duplicateDetails: { rawTitle: string; reason: string }[];
}> {
  const currentEvents = await loadCache();
  const rawEvents = await fetchLiveRawEvents();
  const newItems: AdminEventItem[] = [];
  const duplicateDetails: { rawTitle: string; reason: string }[] = [];

  rawEvents.forEach((raw, idx) => {
    const currentCombined = [...newItems, ...currentEvents];
    const dupCheck = isDuplicateEvent(raw, currentCombined);

    if (dupCheck.isDuplicate) {
      duplicateDetails.push({
        rawTitle: raw.rawTitle,
        reason: dupCheck.reason || 'ตรวจพบข้อมูลที่ซ้ำซ้อน',
      });
    } else {
      const processed = processRawEventWithAI(raw, idx + 1);
      const adminItem: AdminEventItem = {
        ...processed,
        approvalStatus: AUTO_PUBLISH_ENABLED ? 'approved' : 'pending',
        source: raw.source,
        sourceUrl: raw.sourceUrl,
      };
      newItems.push(adminItem);
    }
  });

  // Prepend new items to database
  const updatedEvents = [...newItems, ...currentEvents];
  MEMORY_CACHE = updatedEvents;

  // Persist to disk database
  const db = await readDatabase();
  db.events = updatedEvents;
  await writeDatabase(db);

  return {
    newCount: newItems.length,
    duplicateCount: duplicateDetails.length,
    events: updatedEvents,
    duplicateDetails,
  };
}

export async function resetAndSeedAllEvents(): Promise<{ totalCount: number; events: AdminEventItem[] }> {
  const rawEvents = await fetchLiveRawEvents();
  const allFresh: AdminEventItem[] = [];

  rawEvents.forEach((raw, idx) => {
    const processed = processRawEventWithAI(raw, idx + 1);
    allFresh.push({
      ...processed,
      approvalStatus: 'pending',
      source: raw.source,
      sourceUrl: raw.sourceUrl,
    });
  });

  MEMORY_CACHE = allFresh;

  // Persist fresh master database to disk
  const db = await readDatabase();
  db.events = allFresh;
  await writeDatabase(db);

  return {
    totalCount: allFresh.length,
    events: allFresh,
  };
}

export async function updateEventApproval(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<AdminEventItem[]> {
  const currentEvents = await loadCache();
  const updated = currentEvents.map((ev) => (ev.id === id ? { ...ev, approvalStatus: status } : ev));
  MEMORY_CACHE = updated;

  const db = await readDatabase();
  db.events = updated;
  await writeDatabase(db);

  return updated;
}

export async function approveAllPendingEvents(): Promise<AdminEventItem[]> {
  const currentEvents = await loadCache();
  const updated = currentEvents.map((ev) => (ev.approvalStatus === 'pending' ? { ...ev, approvalStatus: 'approved' as const } : ev));
  MEMORY_CACHE = updated;

  const db = await readDatabase();
  db.events = updated;
  await writeDatabase(db);

  return updated;
}

export async function deleteEvent(id: string): Promise<AdminEventItem[]> {
  const currentEvents = await loadCache();
  const updated = currentEvents.filter((ev) => ev.id !== id);
  MEMORY_CACHE = updated;

  const db = await readDatabase();
  db.events = updated;
  await writeDatabase(db);

  return updated;
}

export const deleteAdminEvent = deleteEvent;

export async function updateAdminEvent(id: string, updatedFields: Partial<AdminEventItem>): Promise<AdminEventItem[]> {
  const currentEvents = await loadCache();
  const updated = currentEvents.map((ev) => (ev.id === id ? { ...ev, ...updatedFields } : ev));
  MEMORY_CACHE = updated;

  const db = await readDatabase();
  db.events = updated;
  await writeDatabase(db);

  return updated;
}

