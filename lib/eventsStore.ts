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

// Ensure database is loaded into cache and auto-enrich direct event URLs
export async function loadCache(): Promise<AdminEventItem[]> {
  if (MEMORY_CACHE !== null && MEMORY_CACHE.length > 0) {
    return MEMORY_CACHE;
  }
  const db = await readDatabase();
  AUTO_PUBLISH_ENABLED = db.autoPublish;

  // Auto-enrich any existing events with updated direct official event URLs
  let hasUpdated = false;
  const enriched = db.events.map((ev) => {
    const seed = REAL_BANGKOK_EVENT_SEEDS.find(
      (s) => s.rawTitle === ev.title || ev.title.includes(s.rawTitle) || s.rawTitle.includes(ev.title)
    );
    if (
      seed &&
      seed.sourceUrl &&
      (!ev.externalUrl ||
        ev.externalUrl !== seed.sourceUrl ||
        ev.externalUrl.includes('thailandnstfair') ||
        ev.externalUrl.includes('event-detail'))
    ) {
      hasUpdated = true;
      return {
        ...ev,
        externalUrl: seed.sourceUrl,
        link: seed.sourceUrl,
        sourceUrl: seed.sourceUrl,
      };
    }
    if (ev.source === 'QSNCC Events' || ev.source === 'QSNCC' || ev.venueTag === 'qsncc' || (ev.location && ev.location.includes('สิริกิติ์'))) {
      if (ev.externalUrl !== 'https://www.qsncc.com/en/whats-on/event-calendar') {
        hasUpdated = true;
        return {
          ...ev,
          externalUrl: 'https://www.qsncc.com/en/whats-on/event-calendar',
          link: 'https://www.qsncc.com/en/whats-on/event-calendar',
          sourceUrl: 'https://www.qsncc.com/en/whats-on/event-calendar',
        };
      }
    }
    if (ev.source && ev.source !== 'Chill & Connect Official' && !ev.id?.startsWith('custom-ev-')) {
      if (ev.eventType !== 'public_venue') {
        hasUpdated = true;
        ev = {
          ...ev,
          eventType: 'public_venue',
        };
      }
    }
    return ev;
  });

  MEMORY_CACHE = enriched;
  if (hasUpdated) {
    db.events = enriched;
    await writeDatabase(db);
  }

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

import { updateSourceScrapedTime } from './sourcesStore';

export async function runScraperAndAIEngine(targetSource?: string): Promise<{
  newCount: number;
  duplicateCount: number;
  totalScanned: number;
  events: AdminEventItem[];
  duplicateDetails: { rawTitle: string; reason: string }[];
}> {
  const currentEvents = await loadCache();
  let rawEvents = await fetchLiveRawEvents();

  if (targetSource) {
    const term = targetSource.toLowerCase();
    rawEvents = rawEvents.filter((r) => {
      const srcLower = (r.source || '').toLowerCase();
      const locLower = (r.rawLocation || '').toLowerCase();
      const urlLower = (r.sourceUrl || '').toLowerCase();
      return (
        srcLower.includes(term) ||
        term.includes(srcLower) ||
        urlLower.includes(term) ||
        (term.includes('impact') && (locLower.includes('impact') || locLower.includes('อิมแพ็ค') || srcLower.includes('impact'))) ||
        (term.includes('qsncc') && (locLower.includes('qsncc') || locLower.includes('สิริกิติ์') || srcLower.includes('qsncc'))) ||
        (term.includes('bitec') && (locLower.includes('bitec') || locLower.includes('ไบเทค') || srcLower.includes('bitec'))) ||
        (term.includes('thaiticket') && (srcLower.includes('thaiticket') || urlLower.includes('thaiticket'))) ||
        (term.includes('thairun') && (srcLower.includes('thairun') || locLower.includes('วิ่ง') || urlLower.includes('thai.run'))) ||
        (term.includes('concert') && (srcLower.includes('concert') || urlLower.includes('theconcert'))) ||
        (term.includes('melon') && (srcLower.includes('melon') || urlLower.includes('ticketmelon'))) ||
        (term.includes('eventpop') && (srcLower.includes('eventpop') || urlLower.includes('eventpop'))) ||
        (term.includes('set') && (srcLower.includes('set') || locLower.includes('ตลาดหลักทรัพย์') || urlLower.includes('set.or.th'))) ||
        (term.includes('bma') && (srcLower.includes('bma') || locLower.includes('กทม') || locLower.includes('สวน')))
      );
    });
  }

  const newItems: AdminEventItem[] = [];
  const duplicateDetails: { rawTitle: string; reason: string }[] = [];

  rawEvents.forEach((raw, idx) => {
    const currentCombined = [...newItems, ...currentEvents];
    const dupCheck = isDuplicateEvent(raw, currentCombined);

    if (dupCheck.isDuplicate) {
      duplicateDetails.push({
        rawTitle: raw.rawTitle,
        reason: dupCheck.reason || 'ตรวจพบข้อมูลที่ซ้ำซ้อนกับในฐานข้อมูล',
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

  // Prepend new items to database only if any new non-duplicate items found
  const updatedEvents = [...newItems, ...currentEvents];
  MEMORY_CACHE = updatedEvents;

  // Persist to disk database
  const db = await readDatabase();
  db.events = updatedEvents;
  await writeDatabase(db);

  // Update source timestamps
  if (targetSource) {
    await updateSourceScrapedTime(targetSource, newItems.length);
  } else {
    // Update all active sources
    const uniqueSources = Array.from(new Set(rawEvents.map((r) => r.source)));
    for (const src of uniqueSources) {
      const addedForSrc = newItems.filter((n) => n.source === src).length;
      await updateSourceScrapedTime(src, addedForSrc);
    }
  }

  return {
    newCount: newItems.length,
    duplicateCount: duplicateDetails.length,
    totalScanned: rawEvents.length,
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

