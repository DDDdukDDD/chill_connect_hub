import { EventItem, ChallengeQuest } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
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
} from './types';

/**
 * Universal Data Repository Interface (DAO Pattern)
 * Decouples the Next.js frontend and API handlers from the underlying storage technology.
 * Allows seamless switching between Local JSON (Development) and PostgreSQL/Supabase (Production).
 */
export interface IDataRepository {
  // ── Events (Community Meetups & Public Fairs) ──
  findEvents(params?: EventQueryParams): Promise<PaginatedResult<EventItem>>;
  findEventById(id: string): Promise<EventItem | null>;
  createEvent(data: CreateEventDTO): Promise<EventItem>;
  updateEvent(id: string, data: UpdateEventDTO): Promise<EventItem | null>;
  deleteEvent(id: string): Promise<boolean>;

  /**
   * Atomic capacity-checked meetup joining
   * Guarantees prevention of race conditions / overbooking even under high concurrency
   */
  atomicJoinEvent(eventId: string, participant: ParticipantInfo): Promise<AtomicJoinResult>;
  atomicLeaveEvent(eventId: string, userId: string): Promise<{ success: boolean; message: string }>;

  // ── Lifestyle Spots (77 Provinces) ──
  findSpots(params?: SpotQueryParams): Promise<PaginatedResult<LifestyleSpotItem>>;
  findSpotById(id: string): Promise<LifestyleSpotItem | null>;
  createSpot(data: CreateSpotDTO): Promise<LifestyleSpotItem>;
  updateSpot(id: string, data: UpdateSpotDTO): Promise<LifestyleSpotItem | null>;
  deleteSpot(id: string): Promise<boolean>;

  // ── Community Quests & Challenges ──
  findQuests(params?: QuestQueryParams): Promise<PaginatedResult<ChallengeQuest>>;
  findQuestById(id: string): Promise<ChallengeQuest | null>;
  createQuest(data: CreateQuestDTO): Promise<ChallengeQuest>;
  updateQuest(id: string, data: UpdateQuestDTO): Promise<ChallengeQuest | null>;

  /**
   * Atomic quest progress / completion
   */
  atomicProgressQuest(questId: string, userId: string, increment?: number): Promise<AtomicQuestResult>;
}
