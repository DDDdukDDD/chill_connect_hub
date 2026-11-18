import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from './db';
import { homeSpotsFor } from './homeSpots';
import { eventListItem, spotListItem } from './listItems';
import { optimizedImage } from './optimizedImage';
import type { Member } from './members/types';
import type { FeedItem } from './moments/service';
import type { CircleItem } from './social/circles';
import { visitsOf } from './social/visits';
import { momentRepository } from './moments';

/**
 * What the member home needs beyond the public lists, read on the server with the page instead of four requests
 * after it (the whole event list in two pages, the place picks as full records, the member's preferences):
 * the place picks and the member's own saved and visited places, the อีเวนต์ they saved or marked that are no
 * longer in the upcoming list, and the สาย and goals they picked at onboarding. All as list items.
 */
export type MemberHomeData = {
  spots: LifestyleSpotItem[];
  extraEvents: EventItem[];
  likedCategories: string[];
  goals: string[];
  /** Place and อีเวนต์ kinds saved with the onboarding answers: the feed cards lead with them */
  spotVibes: string[];
  fairCategories: string[];
  /**
   * ตี้ the member already posted a moment from (newest 100 posts): the "ไปมาแล้ว? แชร์" circle stops asking on every
   * device, not only the one it was posted from (owner 2026-11-18)
   */
  postedTeeIds: string[];
  /** The first page of สำหรับคุณ and Circles, rendered with the page so the feed is there on arrival instead of after a second request */
  feedStart?: HomeFeedStart;
};

export type HomeFeedStart = { items: FeedItem[]; hasNext: boolean; nextCursor?: string; circles: CircleItem[]; findPeople?: boolean };

/**
 * The member home's cards show `image` as it comes (MemberLiveHome, JourneyBand), and the sample events point at
 * ~1 MB originals in /public: the member home downloaded ~5 MB of photos (2026-10-29). Sent already resized
 * instead; the tiles that size their own photos pass a resized link through as it is (lib/optimizedImage.ts).
 */
export const HOME_CARD_WIDTH = 640;
export const sizedImage = <T extends { image?: string }>(item: T): T =>
  item.image ? { ...item, image: optimizedImage(item.image, HOME_CARD_WIDTH) } : item;

export async function memberHomeData(member: Member, upcoming: EventItem[]): Promise<MemberHomeData> {
  const [spots, visits, posts] = await Promise.all([
    homeSpotsFor(member),
    visitsOf(member.id),
    momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 100 }).then((r) => r.items).catch(() => []),
  ]);
  const have = new Set(upcoming.map((event) => event.id));
  const fairIds = [...new Set([...(member.savedEventIds ?? []), ...visits.filter((v) => v.targetType === 'fair').map((v) => v.targetId)])]
    .filter((id) => !have.has(id))
    .slice(0, 100);
  const extra = await Promise.all(fairIds.map((id) => db.findEventById(id)));
  return {
    spots: spots.map((spot) => sizedImage(spotListItem(spot))),
    extraEvents: extra.filter((event): event is EventItem => Boolean(event) && event!.approvalStatus === 'approved').map(eventListItem),
    likedCategories: member.preferences?.interests?.communityCategories ?? [],
    goals: member.preferences?.goals ?? [],
    spotVibes: member.preferences?.interests?.spotVibes ?? [],
    fairCategories: member.preferences?.interests?.fairCategories ?? [],
    postedTeeIds: [...new Set(posts.filter((m) => m.targetType === 'community' && m.targetId).map((m) => m.targetId as string))],
  };
}
