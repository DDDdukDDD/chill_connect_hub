import { EventItem, ChallengeQuest, DayOfWeek, EventRecurrence } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';

export type { DayOfWeek, EventRecurrence };

// ── Pagination & Result DTOs ──
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string | null;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string | null;
}

// ── Query Parameters for the 3 Discovery Pillars ──
export interface EventQueryParams extends PaginationParams {
  eventType?: 'community' | 'public_venue' | 'all';
  category?: string | null;
  province?: string | null;
  zone?: string | null;
  district?: string | null;
  venueTag?: string | null;
  searchQuery?: string | null;
  status?: 'recruiting' | 'full' | 'ended' | 'all';
  includeEnded?: boolean;
}

export interface SpotQueryParams extends PaginationParams {
  category?: string | null;
  province?: string | null;
  vibeTag?: string | null;
  searchQuery?: string | null;
  hasImageOnly?: boolean;
}

export interface QuestQueryParams extends PaginationParams {
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | 'all';
  isPopular?: boolean;
  searchQuery?: string | null;
}

// ── Atomic Operation Payloads ──
export interface ParticipantInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt?: string;
  note?: string;
}

export interface AtomicJoinResult {
  success: boolean;
  message: string;
  status?: 'joined' | 'already_joined' | 'event_full' | 'event_ended' | 'not_found';
  updatedEvent?: EventItem;
  participantsCount?: number;
  maxParticipants?: number;
}

export interface AtomicQuestResult {
  success: boolean;
  message: string;
  status?: 'accepted' | 'progress_updated' | 'completed' | 'not_found';
  updatedQuest?: ChallengeQuest;
  earnedXp?: number;
  earnedBadge?: string;
}

// ── DTOs for Entity Creation / Update ──
export type CreateEventDTO = Omit<EventItem, 'id' | 'createdAtTimestamp'> & {
  id?: string;
  createdAtTimestamp?: number;
  tag?: string;
};
export type UpdateEventDTO = Partial<Omit<EventItem, 'id'>>;

export type CreateSpotDTO = Omit<LifestyleSpotItem, 'id'> & { id?: string };
export type UpdateSpotDTO = Partial<Omit<LifestyleSpotItem, 'id'>>;

export type CreateQuestDTO = Omit<ChallengeQuest, 'id'> & { id?: string };
export type UpdateQuestDTO = Partial<Omit<ChallengeQuest, 'id'>>;
