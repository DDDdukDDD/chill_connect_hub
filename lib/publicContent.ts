import { cache } from 'react';
import { MOCK_EVENTS, getEventById, type EventItem } from '@/data/mockData';
import { MOCK_SPOTS, getSpotById, type LifestyleSpotItem } from '@/data/spotsData';
import { db } from '@/lib/db';
import { isEventEnded } from '@/lib/dateUtils';
import {
  eventInProvince,
  fairSearchText,
  isQuestOpen,
  matchesQuery,
  meetupSearchText,
  questSearchText,
  ALL_PROVINCES,
  type DiscoverCounts,
} from '@/lib/discoverMatch';
import { joinCounts } from '@/lib/social/questJoins';
import { browseSpots } from '@/lib/spotBrowse';

/**
 * What a public detail page shows, read on the server so the content is in the HTML search engines get.
 * `cache` lets the page and its `generateMetadata` share one read per request.
 * Only what the public API would also return: approved events, published places.
 */

/** An approved meetup (`community`) or fair (`public_venue`) by id, or null. */
export const getPublicEvent = cache(async (id: string, eventType: 'community' | 'public_venue'): Promise<EventItem | null> => {
  const event = await db.findEventById(id);
  if (!event || event.approvalStatus !== 'approved') return null;
  const isFair = event.eventType === 'public_venue';
  return isFair === (eventType === 'public_venue') ? event : null;
});

/** A published place by id, or null. */
export const getPublicSpot = cache(async (id: string): Promise<LifestyleSpotItem | null> => {
  const spot = await db.findSpotById(id);
  return spot && spot.publicationStatus !== 'draft' ? spot : null;
});

/** Every page of a paged query (the query engine returns at most 100 a page). */
async function allPages<T>(find: (page: number) => Promise<{ items: T[]; hasNextPage: boolean }>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await find(page);
    items.push(...result.items);
    if (!result.hasNextPage || page >= 100) return items;
  }
}

/** The /community list: approved meetups that are not over, as `GET /api/events?type=community` pages them. */
export const listPublicMeetups = () =>
  allPages((page) => db.findEvents({ page, limit: 100, eventType: 'community', status: 'all', sortBy: 'newest', approvalStatus: 'approved' }));

/** The /events list: approved fairs, ended ones included (the page has its own "ended" filter), like `GET /api/events`. */
export const listPublicFairs = async () =>
  (await db.listAllEvents()).filter((event) => event.approvalStatus === 'approved' && event.eventType === 'public_venue');

/** The /challenges list, with the members who really joined added to the written count (as `GET /api/quests`). */
export const listPublicQuests = async () => {
  const joins = joinCounts();
  const quests = await allPages((page) => db.findQuests({ page, limit: 100 }));
  return quests.map((quest) => ({ ...quest, participantsCount: (quest.participantsCount ?? 0) + (joins.get(quest.id) ?? 0) }));
};

/** True when the pages' bundled sample data has this id (or, for old links, this title); those pages still show it. */
export const isBundledEvent = (id: string) => Boolean(bundledEvent(id));
/** A bundled sample event by id (or, for old links, title), so detail pages send it and the browser needs no sample data */
export const bundledEvent = (id: string): EventItem | null => getEventById(id) ?? MOCK_EVENTS.find((event) => event.title === id) ?? null;
export const isBundledSpot = (id: string) => Boolean(getSpotById(id) || MOCK_SPOTS.some((spot) => spot.title === id));

/** The landing page's events: approved meetups and fairs that are not over (about a third of the full list). */
export const listUpcomingEvents = async () =>
  (await db.listAllEvents()).filter((event) => event.approvalStatus === 'approved' && !isEventEnded(event));

/**
 * How many meetups, fairs and places the ค้นพบ search finds, for the numbers on its tabs (only what is not over,
 * as each page shows by default), plus open challenges for its "ชาเลนจ์ที่ตรงกับ…" line when there is a search word.
 */
export async function discoverCounts(query: string, province: string): Promise<DiscoverCounts> {
  const [meetups, fairs, spots, quests] = await Promise.all([
    listPublicMeetups(),
    listPublicFairs(),
    // The same count /spots shows (hidden places only when searched for), from its cached index
    browseSpots({ q: query, province, limit: 1 }),
    query.trim() ? listPublicQuests() : Promise.resolve([]),
  ]);
  return {
    meetups: meetups.filter((event) => !isEventEnded(event) && eventInProvince(event, province) && matchesQuery(meetupSearchText(event), query)).length,
    fairs: fairs.filter((event) => !isEventEnded(event) && eventInProvince(event, province) && matchesQuery(fairSearchText(event), query)).length,
    spots: spots.total,
    challenges: quests.filter((quest) => isQuestOpen(quest) && matchesQuery(questSearchText(quest), query)).length,
  };
}

/** The ค้นพบ search word and province from a page's address, and the tab counts for them. */
export async function discoverStart(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const province = typeof params.province === 'string' && params.province ? params.province : ALL_PROVINCES;
  return { query, province, counts: await discoverCounts(query, province) };
}
