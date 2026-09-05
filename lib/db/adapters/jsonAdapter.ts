import fs from 'fs/promises';
import path from 'path';
import { EventItem, MOCK_EVENTS, ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';
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
import { cacheManager } from '../../cache';
import {
  filterEvents,
  filterSpots,
  filterQuests,
  paginateArray,
  isEventEnded,
} from '../queryEngine';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'chill_database.json');

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
        await fs.mkdir(DB_DIR, { recursive: true });
        let dbData: { events?: EventItem[]; [key: string]: unknown } | null = null;

        try {
          const raw = await fs.readFile(DB_FILE, 'utf-8');
          dbData = JSON.parse(raw);
        } catch {
          // No file yet
        }

        if (dbData && Array.isArray(dbData.events) && dbData.events.length > 0) {
          this.events = dbData.events;
        } else {
          this.events = [...MOCK_EVENTS];
        }

        // Initialize spots & quests
        this.spots = [...MOCK_SPOTS];
        this.quests = [...MOCK_CHALLENGES];

        this.isInitialized = true;
      } catch (err) {
        console.error('JsonFileAdapter init failed, falling back to mock memory:', err);
        this.events = [...MOCK_EVENTS];
        this.spots = [...MOCK_SPOTS];
        this.quests = [...MOCK_CHALLENGES];
        this.isInitialized = true;
      }
    });
  }

  private async persistEvents(): Promise<void> {
    try {
      let existingData: Record<string, unknown> = {};
      try {
        const raw = await fs.readFile(DB_FILE, 'utf-8');
        existingData = JSON.parse(raw);
      } catch {
        // file might not exist
      }

      existingData.lastUpdated = new Date().toISOString();
      existingData.events = this.events;

      await fs.writeFile(DB_FILE, JSON.stringify(existingData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // ── Events ──
  public async findEvents(params?: EventQueryParams): Promise<PaginatedResult<EventItem>> {
    const cacheKey = `events:${JSON.stringify(params || {})}`;
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        await this.ensureInitialized();
        const filtered = filterEvents(this.events, params);
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
        return this.events.find((e) => e.id === id) || null;
      },
      { ttlMs: 60 * 1000, tags: ['events', `event:${id}`] }
    );
  }

  public async createEvent(data: CreateEventDTO): Promise<EventItem> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const newId = data.id || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newEvent: EventItem = {
        ...data,
        id: newId,
        participantsCount: data.participantsCount ?? 1,
        maxParticipants: data.maxParticipants ?? (data.eventType === 'community' ? 10 : 500),
        status: data.status || 'recruiting',
        createdAtTimestamp: data.createdAtTimestamp || Date.now(),
      };

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
        await this.persistEvents();
        cacheManager.invalidateTags(['events', `event:${id}`]);
      }
      return deleted;
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
      this.spots.unshift(newSpot);
      cacheManager.invalidateTag('spots');
      return newSpot;
    });
  }

  public async updateSpot(id: string, data: UpdateSpotDTO): Promise<LifestyleSpotItem | null> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const idx = this.spots.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const updated = { ...this.spots[idx], ...data };
      this.spots[idx] = updated;
      cacheManager.invalidateTags(['spots', `spot:${id}`]);
      return updated;
    });
  }

  public async deleteSpot(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const initLen = this.spots.length;
      this.spots = this.spots.filter((s) => s.id !== id);
      const deleted = this.spots.length < initLen;
      if (deleted) {
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
        const filtered = filterQuests(this.quests, params);
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
        return this.quests.find((q) => q.id === id) || null;
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
      this.quests.unshift(newQuest);
      cacheManager.invalidateTag('quests');
      return newQuest;
    });
  }

  public async updateQuest(id: string, data: UpdateQuestDTO): Promise<ChallengeQuest | null> {
    await this.ensureInitialized();
    return this.mutex.runExclusive(async () => {
      const idx = this.quests.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      const updated = { ...this.quests[idx], ...data };
      this.quests[idx] = updated;
      cacheManager.invalidateTags(['quests', `quest:${id}`]);
      return updated;
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
      this.userQuests[userId][questId] = next;

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
