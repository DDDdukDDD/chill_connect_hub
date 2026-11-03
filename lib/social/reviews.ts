import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { thaiTimeAgo } from '../moments/service';
import { reviewStore } from './stores';

/** What a participant says about an event after it. Shown on the host's profile. */
export interface EventReview {
  id: string;
  eventId: string;
  eventTitle: string;
  /** The member who ran the event; absent for official or sample events */
  hostId?: string;
  authorId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export const MAX_REVIEW_LENGTH = 300;

export const reviewedEventIdsOf = async (memberId: string) => (await reviewStore.byAuthor(memberId)).map((r) => r.eventId);
export const hasReviewed = async (memberId: string, eventId: string) => (await reviewStore.byAuthor(memberId)).some((r) => r.eventId === eventId);

export const addReview = (review: Omit<EventReview, 'id' | 'createdAt'>): Promise<EventReview> => reviewStore.add(review);

/** Average and latest reviews of the events a member hosted */
export async function hostReviewSummary(hostId: string, latestCount = 4, viewer?: { blockedIds?: string[] } | null) {
  const blocked = new Set(viewer?.blockedIds ?? []);
  const mine = (await reviewStore.aboutHost(hostId)).filter((r) => !blocked.has(r.authorId));
  if (mine.length === 0) return { count: 0, average: 0, latest: [] };
  const latest = [];
  const authors = await memberRepository.findByIds(mine.slice(0, latestCount).map((r) => r.authorId));
  for (const r of mine.slice(0, latestCount)) {
    const author = authors.get(r.authorId);
    latest.push({
      id: r.id,
      rating: r.rating,
      text: r.text,
      eventTitle: r.eventTitle,
      authorId: author?.status === 'active' ? r.authorId : null,
      authorName: author?.status === 'active' ? tidyDisplayName(author.displayName).trim() || author.displayName : 'สมาชิก',
      timeAgo: thaiTimeAgo(r.createdAt),
    });
  }
  return { count: mine.length, average: Math.round((mine.reduce((sum, r) => sum + r.rating, 0) / mine.length) * 10) / 10, latest };
}

export const reviewById = (id: string): Promise<EventReview | undefined> => reviewStore.find(id);

/** Staff take a review down after a report; returns false when it is already gone */
export async function removeReview(id: string): Promise<boolean> {
  return reviewStore.remove(id);
}

/** Account deletion: reviews the member wrote go with them; reviews about them stay with the events */
export async function removeReviewsBy(memberId: string): Promise<void> {
  await reviewStore.removeBy(memberId);
}
