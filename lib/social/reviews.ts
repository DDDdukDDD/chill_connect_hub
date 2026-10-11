import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { thaiTimeAgo } from '../moments/service';
import { createJsonStore } from './jsonStore';

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

const store = createJsonStore<EventReview>('reviews');
export const MAX_REVIEW_LENGTH = 300;

export const reviewedEventIdsOf = (memberId: string) => store.read().filter((r) => r.authorId === memberId).map((r) => r.eventId);
export const hasReviewed = (memberId: string, eventId: string) => store.read().some((r) => r.authorId === memberId && r.eventId === eventId);

export async function addReview(review: Omit<EventReview, 'id' | 'createdAt'>): Promise<EventReview> {
  const saved: EventReview = { ...review, id: `rev_${randomUUID()}`, createdAt: new Date().toISOString() };
  await store.update((items) => [saved, ...items]);
  return saved;
}

/** Average and latest reviews of the events a member hosted */
export async function hostReviewSummary(hostId: string, latestCount = 3) {
  const mine = store.read().filter((r) => r.hostId === hostId);
  if (mine.length === 0) return { count: 0, average: 0, latest: [] };
  const latest = [];
  for (const r of mine.slice(0, latestCount)) {
    const author = await memberRepository.findById(r.authorId);
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

/** Account deletion: reviews the member wrote go with them; reviews about them stay with the events */
export async function removeReviewsBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((r) => r.authorId !== memberId));
}
