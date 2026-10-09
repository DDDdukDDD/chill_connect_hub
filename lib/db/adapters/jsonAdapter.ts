import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventItem, ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';
import { LifestyleSpotItem, MOCK_SPOTS } from '@/data/spotsData';
import { IDataRepository } from '../repository';
import {
  EventQueryParams,
  SpotQueryParams,
  QuestQueryParams,
  PaginatedResult,
  ParticipantInfo,
  AtomicJoinResult,
  AtomicQuestResult,
  CreateEventDTO,
  UpdateEventDTO,
  CreateSpotDTO,
  UpdateSpotDTO,
  CreateQuestDTO,
  UpdateQuestDTO,
} from '../types';
import { AsyncMutex } from '../mutex';
import { readDatabase, updateDatabase } from '../databaseFile';
import { normalizeStoredEvents } from '../../eventNormalization';
import { rollSampleEventDate, rollSampleEventDates } from '../../sampleEventDates';
import { applyQuestLifecycle, upgradeLegacySeedQuests } from '../../questLifecycle';
import type { AdminEventItem } from '../../eventsStore';
import { cacheManager } from '../../cache';
import {
  filterEvents,
  filterSpots,
  filterQuests,
  paginateArray,
  isEventEnded,
} from '../queryEngine';

const DB_DIR = path.join(process.cwd(), 'data');
const DISCOVERY_DB_FILE = path.join(DB_DIR, 'discovery_content.json');
const TMP_DISCOVERY_DB_FILE = path.join(os.tmpdir(), 'discovery_content.json');
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY
);

/**
 * High-Performance JSON & Memory Adapter
 * Provides thread-safe, atomic operations with async mutex protection.
 */
export class JsonFileAdapter implements IDataRepository {
  private mutex = new AsyncMutex();
  private isInitialized = false;

  // In-memory collections (Fast reads)
  private events: EventItem[] = [];
  private spots: LifestyleSpotItem[] = [];
  private quests: ChallengeQuest[] = [];
  private participants: Record<string, ParticipantInfo[]> = {}; // eventId -> participants[]
  private userQuests: Record<string, Record<string, number>> = {}; // userId -> { questId: currentProgress }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    await this.mutex.runExclusive(async () => {
      if (this.isInitialized) return;

      try {
        // Events & participants: this adapter is the only writer of these keys in chill_database.json
        const dbData = await readDatabase();
        const storedEvents = Array.isArray(dbData.events) ? dbData.events : [];
        const { events, changed } = normalizeStoredEvents(storedEvents);
        this.events = events;
        this.participants = dbData.participants || {};
        if (changed || storedEvents.length === 0) {
          await this.persistEvents();
        }

        let contentData: {
          spots?: LifestyleSpotItem[];
          quests?: ChallengeQuest[];
          userQuests?: Record<string, Record<string, number>>;
        } | null = null;
        const contentFiles = IS_SERVERLESS
          ? [TMP_DISCOVERY_DB_FILE, DISCOVERY_DB_FILE]
          : [DISCOVERY_DB_FILE];

        for (const contentFile of contentFiles) {
          try {
            const raw = await fs.readFile(contentFile, 'utf-8');
            contentData = JSON.parse(raw);
            break;
          } catch {
            // Try the next content file or use seeded defaults.
          }
        }

        this.spots = Array.isArray(contentData?.spots) ? contentData.spots : [...MOCK_SPOTS];
        const storedQuests = Array.isArray(contentData?.quests) ? contentData.quests : [...MOCK_CHALLENGES];
        const upgradedQuests = upgradeLegacySeedQuests(storedQuests, MOCK_CHALLENGES);
        this.quests = upgradedQuests.quests;
        this.userQuests = contentData?.userQuests || {};
        if (upgradedQuests.changed) {
          await this.persistDiscoveryContent();
        }

        this.isInitialized = true;
      } catch (err) {
        console.warn('JsonFileAdapter init notice, using memory store:', err);
        this.events = normalizeStoredEvents([]).events;
        this.participants = {};
        this.spots = [...MOCK_SPOTS];
        this.quests = [...MOCK_CHALLENGES];
        this.userQuests = {};
        this.isInitialized = true;
      }
    });
  }

  private async persistDiscoveryContent(
    spots: LifestyleSpotItem[] = this.spots,
    quests: ChallengeQuest[] = this.quests,
    userQuests: Record<string, Record<string, number>> = this.userQuests
  ): Promise<void> {
    const targetFile = IS_SERVERLESS ? TMP_DISCOVERY_DB_FILE : DISCOVERY_DB_FILE;
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(
      targetFile,
      JSON.stringify({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        spots,
        quests,
        userQuests,
      }, null, 2),
      'utf-8'
    );
  }

  /**
   * Writes only the keys this adapter owns (events, participants); other keys such as
   * sources and autoPublish are preserved by the shared serialized file update.
   */
  private async persistEvents(): Promise<void> {
    try {
      await updateDatabase((dbData) => {
        dbData.events = this.events as AdminEventItem[];
        dbData.participants = this.participants;
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.warn('Notice: Could not persist events to disk:', error?.message);
    }
  }

  private buildEvent(data: CreateEventDTO, takenIds: Set<string>): EventItem {
    const requestedId = data.id && !takenIds.has(data.id) ? data.id : undefined;
    const newId = requestedId || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    takenIds.add(newId);
    return {
      ...data,
      id: newId,
      participantsCount: data.participantsCount ?? 1,
      maxParticipants: data.maxParticipants ?? (data.eventType === 'community' ? 10 : 500),
      status: data.status || 'recruiting',
      createdAtTimestamp: data.createdAtTimestamp || Date.now(),
    };
  }

  // ── Events ──
  public async findEvents(params?: EventQueryParams): Promise<PaginatedResult<EventItem>> {
    const cacheKey = `events:${JSON.stringify(params || {})}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        // Sample meetups roll forward on read so they never all expire (see lib/sampleEventDates.ts)
        const filtered = filterEvents(rollSampleEventDates(this.events), params);
        return paginateArray(filtered, params?.page || 1, params?.limit || 12);
      },
      { ttlMs: 30 * 1000, tags: ['events'] }
    );
  }

  public async findEventById(id: string): Promise<EventItem | null> {
    const cacheKey = `event:${id}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        const event = this.events.find((e) => e.id === id);
        return event ? rollSampleEventDate(event) : null;
      },
      { ttlMs: 60 * 1000, tags: ['events', `event:${id}`] }
    );
  }

  public async createEvent(data: CreateEventDTO): Promise<EventItem> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const newEvent = this.buildEvent(data, new Set(this.events.map((e) => e.id)));

      this.events.unshift(newEvent);
      await this.persistEvents();
      cacheManager.invalidateTag('events');
      return newEvent;
    });
  }

  public async updateEvent(id: string, data: UpdateEventDTO): Promise<EventItem | null> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const idx = this.events.findIndex((e) => e.id === id);
      if (idx === -1) return null;

      const updated: EventItem = {
        ...this.events[idx],
        ...data,
      };

      this.events[idx] = updated;
      await this.persistEvents();
      cacheManager.invalidateTags(['events', `event:${id}`]);
      return updated;
    });
  }

  public async deleteEvent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const initLen = this.events.length;
      this.events = this.events.filter((e) => e.id !== id);
      const deleted = this.events.length < initLen;
      if (deleted) {
        delete this.participants[id];
        await this.persistEvents();
        cacheManager.invalidateTags(['events', `event:${id}`]);
      }
      return deleted;
    });
  }

  public async listAllEvents(): Promise<EventItem[]> {
    await this.ensureInitialized();
    return rollSampleEventDates(this.events);
  }

  public async createEvents(data: CreateEventDTO[]): Promise<EventItem[]> {
    await this.ensureInitialized();
    if (data.length === 0) return [];
    return this.mutex.runExclusive(async () => {
      const takenIds = new Set(this.events.map((e) => e.id));
      const created = data.map((item) => this.buildEvent(item, takenIds));
      this.events = [...created, ...this.events];
      await this.persistEvents();
      cacheManager.invalidateTag('events');
      return created;
    });
  }

  public async bulkUpdateEvents(updates: Array<{ id: string; data: UpdateEventDTO }>): Promise<number> {
    await this.ensureInitialized();
    if (updates.length === 0) return 0;
    return this.mutex.runExclusive(async () => {
      const updatesById = new Map(updates.map((u) => [u.id, u.data]));
      let updatedCount = 0;
      this.events = this.events.map((ev) => {
        const data = updatesById.get(ev.id);
        if (!data) return ev;
        updatedCount += 1;
        return { ...ev, ...data };
      });
      if (updatedCount > 0) {
        await this.persistEvents();
        cacheManager.invalidateTag('events');
      }
      return updatedCount;
    });
  }

  public async replaceAllEvents(events: EventItem[]): Promise<number> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      this.events = [...events];
      const remainingIds = new Set(events.map((e) => e.id));
      this.participants = Object.fromEntries(
        Object.entries(this.participants).filter(([eventId]) => remainingIds.has(eventId))
      );
      await this.persistEvents();
      cacheManager.invalidateTag('events');
      return this.events.length;
    });
  }

  /**
   * Atomic Capacity-Checked Meetup Joining
   * Guarantees prevention of race conditions / overbooking even under high concurrent traffic
   */
  public async atomicJoinEvent(eventId: string, participant: ParticipantInfo): Promise<AtomicJoinResult> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const event = this.events.find((e) => e.id === eventId);
      if (!event) {
        return { success: false, message: 'ไม่พบกิจกรรมที่ระบุ', status: 'not_found' };
      }

      if (isEventEnded(event)) {
        return { success: false, message: 'กิจกรรมนี้สิ้นสุดแล้ว', status: 'event_ended' };
      }

      const list = this.participants[eventId] || [];
      const alreadyJoined = list.some((p) => p.userId === participant.userId);
      if (alreadyJoined) {
        return {
          success: false,
          message: 'คุณได้เข้าร่วมกิจกรรมนี้แล้ว',
          status: 'already_joined',
          updatedEvent: event,
        };
      }

      const currentCount = event.participantsCount || 0;
      const maxAllowed = event.maxParticipants || 10;

      // ATOMIC CHECK: Do not allow joining if event is full
      if (currentCount >= maxAllowed) {
        event.status = 'full';
        return {
          success: false,
          message: 'กิจกรรมนี้มีผู้เข้าร่วมเต็มจำนวนแล้ว',
          status: 'event_full',
          participantsCount: currentCount,
          maxParticipants: maxAllowed,
        };
      }

      // Safe to increment
      const newCount = currentCount + 1;
      event.participantsCount = newCount;
      if (newCount >= maxAllowed) {
        event.status = 'full';
      }

      list.push({
        ...participant,
        joinedAt: participant.joinedAt || new Date().toISOString(),
      });
      this.participants[eventId] = list;

      await this.persistEvents();
      cacheManager.invalidateTags(['events', `event:${eventId}`]);

      return {
        success: true,
        message: 'เข้าร่วมกิจกรรมสำเร็จ!',
        status: 'joined',
        updatedEvent: event,
        participantsCount: newCount,
        maxParticipants: maxAllowed,
      };
    });
  }

  public async atomicLeaveEvent(eventId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const event = this.events.find((e) => e.id === eventId);
      if (!event) return { success: false, message: 'ไม่พบกิจกรรม' };

      const list = this.participants[eventId] || [];
      const idx = list.findIndex((p) => p.userId === userId);
      if (idx === -1) return { success: false, message: 'คุณยังไม่ได้เข้าร่วมกิจกรรมนี้' };

      list.splice(idx, 1);
      this.participants[eventId] = list;

      event.participantsCount = Math.max(0, (event.participantsCount || 1) - 1);
      if (event.participantsCount < (event.maxParticipants || 10) && event.status === 'full') {
        event.status = 'recruiting';
      }

      await this.persistEvents();
      cacheManager.invalidateTags(['events', `event:${eventId}`]);
      return { success: true, message: 'ยกเลิกการเข้าร่วมเรียบร้อย' };
    });
  }

  // ── Lifestyle Spots ──
  public async findSpots(params?: SpotQueryParams): Promise<PaginatedResult<LifestyleSpotItem>> {
    const cacheKey = `spots:${JSON.stringify(params || {})}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        const filtered = filterSpots(this.spots, params);
        return paginateArray(filtered, params?.page || 1, params?.limit || 12);
      },
      { ttlMs: 60 * 1000, tags: ['spots'] }
    );
  }

  public async findSpotById(id: string): Promise<LifestyleSpotItem | null> {
    const cacheKey = `spot:${id}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        return this.spots.find((s) => s.id === id) || null;
      },
      { ttlMs: 120 * 1000, tags: ['spots', `spot:${id}`] }
    );
  }

  public async createSpot(data: CreateSpotDTO): Promise<LifestyleSpotItem> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const newSpot: LifestyleSpotItem = {
        ...data,
        id: data.id || `spot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const updatedSpots = [newSpot, ...this.spots];
      await this.persistDiscoveryContent(updatedSpots);
      this.spots = updatedSpots;
      cacheManager.invalidateTag('spots');
      return newSpot;
    });
  }

  public async createSpots(data: CreateSpotDTO[]): Promise<LifestyleSpotItem[]> {
    if (data.length === 0) return [];
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const created: LifestyleSpotItem[] = data.map((spot, index) => ({
        ...spot,
        id: spot.id || `spot-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      }));
      const updatedSpots = [...created, ...this.spots];
      await this.persistDiscoveryContent(updatedSpots);
      this.spots = updatedSpots;
      cacheManager.invalidateTag('spots');
      return created;
    });
  }

  public async updateSpot(id: string, data: UpdateSpotDTO): Promise<LifestyleSpotItem | null> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const idx = this.spots.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const updated = { ...this.spots[idx], ...data };
      const updatedSpots = [...this.spots];
      updatedSpots[idx] = updated;
      await this.persistDiscoveryContent(updatedSpots);
      this.spots = updatedSpots;
      cacheManager.invalidateTags(['spots', `spot:${id}`]);
      return updated;
    });
  }

  public async bulkUpdateSpots(spots: Array<Partial<LifestyleSpotItem> & { id: string }>): Promise<number> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const updates = new Map(spots.map((spot) => [spot.id, spot]));
      let updatedCount = 0;
      const updatedSpots = this.spots.map((spot) => {
        const update = updates.get(spot.id);
        if (!update) return spot;
        updatedCount += 1;
        return { ...spot, ...update };
      });

      if (updatedCount === 0) return 0;
      await this.persistDiscoveryContent(updatedSpots);
      this.spots = updatedSpots;
      cacheManager.invalidateTag('spots');
      return updatedCount;
    });
  }

  public async deleteSpot(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const initLen = this.spots.length;
      const updatedSpots = this.spots.filter((s) => s.id !== id);
      const deleted = updatedSpots.length < initLen;
      if (deleted) {
        await this.persistDiscoveryContent(updatedSpots);
        this.spots = updatedSpots;
        cacheManager.invalidateTags(['spots', `spot:${id}`]);
      }
      return deleted;
    });
  }

  // ── Quests ──
  public async findQuests(params?: QuestQueryParams): Promise<PaginatedResult<ChallengeQuest>> {
    const cacheKey = `quests:${JSON.stringify(params || {})}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        // Lifecycle (daysRemaining / ended) is derived from endDate before filtering by status
        const filtered = filterQuests(this.quests.map((quest) => applyQuestLifecycle(quest)), params);
        return paginateArray(filtered, params?.page || 1, params?.limit || 12);
      },
      { ttlMs: 60 * 1000, tags: ['quests'] }
    );
  }

  public async findQuestById(id: string): Promise<ChallengeQuest | null> {
    const cacheKey = `quest:${id}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        const quest = this.quests.find((q) => q.id === id);
        return quest ? applyQuestLifecycle(quest) : null;
      },
      { ttlMs: 120 * 1000, tags: ['quests', `quest:${id}`] }
    );
  }

  public async createQuest(data: CreateQuestDTO): Promise<ChallengeQuest> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const newQuest: ChallengeQuest = {
        ...data,
        id: data.id || `quest-${Date.now()}`,
      };
      const updatedQuests = [newQuest, ...this.quests];
      await this.persistDiscoveryContent(this.spots, updatedQuests);
      this.quests = updatedQuests;
      cacheManager.invalidateTag('quests');
      return applyQuestLifecycle(newQuest);
    });
  }

  public async updateQuest(id: string, data: UpdateQuestDTO): Promise<ChallengeQuest | null> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const idx = this.quests.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      // daysRemaining is always computed, never stored
      const { daysRemaining: _computed, ...updated } = { ...this.quests[idx], ...data };
      void _computed;
      const updatedQuests = [...this.quests];
      updatedQuests[idx] = updated;
      await this.persistDiscoveryContent(this.spots, updatedQuests);
      this.quests = updatedQuests;
      cacheManager.invalidateTags(['quests', `quest:${id}`]);
      return applyQuestLifecycle(updated);
    });
  }

  public async deleteQuest(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const updatedQuests = this.quests.filter((quest) => quest.id !== id);
      if (updatedQuests.length === this.quests.length) return false;
      await this.persistDiscoveryContent(this.spots, updatedQuests);
      this.quests = updatedQuests;
      cacheManager.invalidateTags(['quests', `quest:${id}`]);
      return true;
    });
  }

  public async atomicProgressQuest(questId: string, userId: string, increment: number = 1): Promise<AtomicQuestResult> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const quest = this.quests.find((q) => q.id === questId);
      if (!quest) return { success: false, message: 'ไม่พบชาเลนจ์', status: 'not_found' };

      if (!this.userQuests[userId]) this.userQuests[userId] = {};
      const cur = this.userQuests[userId][questId] || 0;
      const target = parseInt(quest.total || '3', 10) || 3;
      const next = Math.min(target, cur + increment);
      const updatedUserQuests = {
        ...this.userQuests,
        [userId]: { ...this.userQuests[userId], [questId]: next },
      };
      await this.persistDiscoveryContent(this.spots, this.quests, updatedUserQuests);
      this.userQuests = updatedUserQuests;

      const isCompleted = next >= target;
      cacheManager.invalidateTags(['quests', `quest:${questId}`]);

      return {
        success: true,
        message: isCompleted ? 'ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว' : 'บันทึกความคืบหน้าสำเร็จ',
        status: isCompleted ? 'completed' : 'progress_updated',
        updatedQuest: quest,
        earnedXp: isCompleted ? (quest.rewardPoints || 100) : 0,
        earnedBadge: isCompleted ? quest.badgeLabel : undefined,
      };
    });
  }
}
