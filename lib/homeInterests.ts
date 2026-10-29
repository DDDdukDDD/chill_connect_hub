import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { getCommunityEventCategory, getFairEventCategory } from '@/data/masterHub';
import { getSpotVibeCategory } from '@/lib/spotVibe';

/**
 * What the member home's feed cards offer and in which order (owner 2026-10-29): first what the member picked at
 * onboarding (goals, สาย, and the place and อีเวนต์ kinds that go with them), then, as they use the app, what they
 * join, save and take part in. Things they did count more than things they picked.
 */

export type FeedCardKind = 'meetup' | 'challenge' | 'fair' | 'spot';

export interface MemberSignals {
  goals: string[];
  /** ตี้ categories (สาย) picked at onboarding */
  sai: string[];
  /** Place and อีเวนต์ kinds saved with the onboarding answers */
  spotVibes: string[];
  fairCategories: string[];
  joined: EventItem[];
  hosted: EventItem[];
  savedEvents: EventItem[];
  joinedQuests: ChallengeQuest[];
  savedSpots: LifestyleSpotItem[];
}

export interface FeedInterests {
  sai: Map<string, number>;
  spotVibes: Map<string, number>;
  fairCategories: Map<string, number>;
  /** Card kinds, the one the member cares most about first */
  kinds: FeedCardKind[];
}

const PICKED = 2;
const DID = 3;
const SAVED = 1;

// Onboarding goals that point at one kind of card
const GOAL_KIND: Record<string, FeedCardKind> = {
  join_community: 'meetup',
  find_friends: 'meetup',
  community_host: 'meetup',
  earn_xp: 'challenge',
  explore_fairs: 'fair',
  event_organizer: 'fair',
  explore_spots: 'spot',
  venue_space: 'spot',
};
// With nothing to go on: ตี้ first (the core), then challenges, อีเวนต์ and places
const BASE_ORDER: FeedCardKind[] = ['meetup', 'challenge', 'fair', 'spot'];

function add(map: Map<string, number>, key: string | undefined, weight: number) {
  if (key) map.set(key, (map.get(key) ?? 0) + weight);
}

export function feedInterests(signals: MemberSignals): FeedInterests {
  const sai = new Map<string, number>();
  const spotVibes = new Map<string, number>();
  const fairCategories = new Map<string, number>();
  for (const id of signals.sai) add(sai, id, PICKED);
  for (const id of signals.spotVibes) add(spotVibes, id, PICKED);
  for (const id of signals.fairCategories) add(fairCategories, id, PICKED);

  const kindScore = new Map<FeedCardKind, number>(BASE_ORDER.map((kind, i) => [kind, (BASE_ORDER.length - i) / 10]));
  const bump = (kind: FeedCardKind, by: number) => kindScore.set(kind, (kindScore.get(kind) ?? 0) + by);
  for (const goal of signals.goals) if (GOAL_KIND[goal]) bump(GOAL_KIND[goal], 3);

  for (const event of [...signals.joined, ...signals.hosted]) {
    if (event.eventType === 'public_venue') {
      add(fairCategories, getFairEventCategory(event), DID);
      bump('fair', 1);
    } else {
      add(sai, getCommunityEventCategory(event), DID);
      bump('meetup', 1);
    }
  }
  for (const event of signals.savedEvents) {
    if (event.eventType === 'public_venue') {
      add(fairCategories, getFairEventCategory(event), SAVED);
      bump('fair', 0.5);
    } else {
      add(sai, getCommunityEventCategory(event), SAVED);
      bump('meetup', 0.5);
    }
  }
  for (const quest of signals.joinedQuests) {
    add(sai, quest.category, PICKED);
    bump('challenge', 1);
  }
  for (const spot of signals.savedSpots) {
    add(spotVibes, getSpotVibeCategory(spot), PICKED);
    bump('spot', 0.5);
  }

  const kinds = [...BASE_ORDER].sort((a, b) => (kindScore.get(b) ?? 0) - (kindScore.get(a) ?? 0));
  return { sai, spotVibes, fairCategories, kinds };
}

/** The items that match the member most first; equal ones keep the order they came in (soonest, most popular) */
export function rankByInterest<T>(items: T[], weight: (item: T) => number): T[] {
  return items
    .map((item, i) => ({ item, i, w: weight(item) }))
    .sort((a, b) => b.w - a.w || a.i - b.i)
    .map(({ item }) => item);
}
