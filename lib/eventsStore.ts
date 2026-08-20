import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { processRawEventWithAI } from './aiTagger';
import { fetchLiveRawEvents, REAL_BANGKOK_EVENT_SEEDS } from './eventScraper';
import { isDuplicateEvent } from './deduplication';

export interface AdminEventItem extends EventItem {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  source?: string;
  sourceUrl?: string;
}

// In-memory persistent singleton store for the session
let GLOBAL_EVENTS: AdminEventItem[] = [
  // Initialize existing mock events as approved
  ...MOCK_EVENTS.map((ev) => ({
    ...ev,
    approvalStatus: 'approved' as const,
    source: 'Chill & Connect Official',
  })),
];

let AUTO_PUBLISH_ENABLED: boolean = false;

export function getAllAdminEvents(): AdminEventItem[] {
  return GLOBAL_EVENTS;
}

export function getApprovedPublicEvents(): EventItem[] {
  return GLOBAL_EVENTS.filter((ev) => ev.approvalStatus === 'approved');
}

export function setAutoPublish(enabled: boolean) {
  AUTO_PUBLISH_ENABLED = enabled;
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
  const rawEvents = await fetchLiveRawEvents();
  const newItems: AdminEventItem[] = [];
  const duplicateDetails: { rawTitle: string; reason: string }[] = [];

  rawEvents.forEach((raw, idx) => {
    // Check against existing database AND newly parsed items in current batch
    const currentCombined = [...newItems, ...GLOBAL_EVENTS];
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

  // Prepend new scraped events to top of store
  GLOBAL_EVENTS = [...newItems, ...GLOBAL_EVENTS];

  return {
    newCount: newItems.length,
    duplicateCount: duplicateDetails.length,
    events: GLOBAL_EVENTS,
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

  GLOBAL_EVENTS = allFresh;
  return {
    totalCount: GLOBAL_EVENTS.length,
    events: GLOBAL_EVENTS,
  };
}

export function updateEventApproval(id: string, status: 'approved' | 'rejected' | 'pending') {
  GLOBAL_EVENTS = GLOBAL_EVENTS.map((ev) => {
    if (ev.id === id) {
      return { ...ev, approvalStatus: status };
    }
    return ev;
  });
  return GLOBAL_EVENTS;
}

export function approveAllPendingEvents() {
  GLOBAL_EVENTS = GLOBAL_EVENTS.map((ev) => {
    if (ev.approvalStatus === 'pending') {
      return { ...ev, approvalStatus: 'approved' };
    }
    return ev;
  });
  return GLOBAL_EVENTS;
}

export function deleteAdminEvent(id: string) {
  GLOBAL_EVENTS = GLOBAL_EVENTS.filter((ev) => ev.id !== id);
  return GLOBAL_EVENTS;
}

export function updateAdminEvent(id: string, updatedFields: Partial<AdminEventItem>) {
  GLOBAL_EVENTS = GLOBAL_EVENTS.map((ev) => {
    if (ev.id === id) {
      return { ...ev, ...updatedFields };
    }
    return ev;
  });
  return GLOBAL_EVENTS;
}
