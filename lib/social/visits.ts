import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { momentRepository } from '../moments';
import { isPubliclyVisible, loadPeople } from '../moments/service';
import type { Moment } from '../moments/types';
import { createJsonStore } from './jsonStore';
import { evidencePassed } from '../moments/evidence';
import { memberRepository } from '../members';

/**
 * A visit: one member went to one place or event, with evidence. It is the link between the parts
 * of the product: "who has been" on a place or event, challenge progress and points all read from here.
 *
 * Evidence, strongest first:
 *  - 'checkin': the host checked the member in at a community event (participants store)
 *  - 'moment':  the member posted a photo moment tied to the target (moments store)
 *  - 'marked':  the member pressed "I have been here" on a place or fair (this file's store)
 * The first two are read from the stores that already hold them; nothing is copied.
 */
export type VisitTargetType = 'spot' | 'community' | 'fair';
export type VisitEvidence = 'checkin' | 'moment' | 'marked';

export interface Visit {
  targetType: VisitTargetType;
  targetId: string;
  evidence: VisitEvidence;
  at: string;
  /** A photo moment still waiting for staff review: the member has been, but it does not count toward challenges yet */
  pending?: boolean;
}

/** "I have been here" on a place or a fair, with an optional 1 to 5 rating */
export interface MarkedVisit {
  id: string;
  memberId: string;
  targetType: 'spot' | 'fair';
  targetId: string;
  rating?: number;
  /** A short review with the rating ("มาเช้าวันธรรมดาคนน้อย"), shown on the place or fair page */
  review?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SocialProof {
  /** Distinct people with any evidence of having been */
  beenCount: number;
  /** A few of them, from public moments only (a mark or a check-in does not publish a name) */
  people: { name: string; avatar?: string }[];
  /** Photos from public moments tied to the target, newest first (a preview; the feed shows the rest) */
  photos: { url: string; momentId: string }[];
  /** All published moments tied to the target */
  momentsCount: number;
  /** Average of the ratings members gave when marking a visit */
  rating?: { average: number; count: number };
}

const store = createJsonStore<MarkedVisit>('visits');
const TARGET_TYPES: VisitTargetType[] = ['spot', 'community', 'fair'];
const EVIDENCE_RANK: Record<VisitEvidence, number> = { checkin: 3, moment: 2, marked: 1 };

export const isVisitTargetType = (value: unknown): value is VisitTargetType => TARGET_TYPES.includes(value as VisitTargetType);
export const targetKey = (targetType: VisitTargetType, targetId: string) => `${targetType}:${targetId}`;

/** How many of a target's newest moments are read to find faces and photos; the total comes from the store's count */
const MOMENTS_PER_TARGET = 60;

async function targetMoments(targetType: VisitTargetType, targetId: string): Promise<{ moments: Moment[]; totalCount: number }> {
  const { items, totalCount } = await momentRepository.query({ statuses: ['published'], targetType, targetId, sort: 'newest', page: 1, limit: MOMENTS_PER_TARGET });
  const people = await loadPeople(items);
  return { moments: items.filter((m) => isPubliclyVisible(m, people)), totalCount };
}

/** Who has been to each target. One call serves a whole row of cards. */
export async function socialProofFor(targets: { targetType: VisitTargetType; targetId: string }[]): Promise<Record<string, SocialProof>> {
  const wanted = new Set(targets.map((t) => targetKey(t.targetType, t.targetId)));
  const visitors = new Map<string, Set<string>>();
  const proofs: Record<string, SocialProof> = {};
  for (const key of wanted) {
    visitors.set(key, new Set());
    proofs[key] = { beenCount: 0, people: [], photos: [], momentsCount: 0 };
  }

  // Authors beyond the newest moments read are not known one by one; each older moment is counted as one more person
  const olderMoments = new Map<string, number>();
  for (const key of wanted) {
    const at = key.indexOf(':');
    const { moments, totalCount } = await targetMoments(key.slice(0, at) as VisitTargetType, key.slice(at + 1));
    const proof = proofs[key];
    proof.momentsCount = totalCount;
    olderMoments.set(key, Math.max(0, totalCount - MOMENTS_PER_TARGET));
    for (const moment of moments) {
      // Sample moments have no member behind them; each counts as its own person
      const person = moment.authorId ?? `sample:${moment.authorName}`;
      if (!visitors.get(key)!.has(person)) {
        visitors.get(key)!.add(person);
        if (proof.people.length < 3) proof.people.push({ name: tidyDisplayName(moment.authorName), avatar: moment.authorAvatar });
      }
      if (proof.photos.length < 3 && moment.images[0]) proof.photos.push({ url: moment.images[0], momentId: moment.id });
    }
  }

  const ratings = new Map<string, number[]>();
  for (const mark of store.read()) {
    const key = targetKey(mark.targetType, mark.targetId);
    if (!proofs[key]) continue;
    visitors.get(key)!.add(mark.memberId);
    if (mark.rating) ratings.set(key, [...(ratings.get(key) ?? []), mark.rating]);
  }

  for (const target of targets) {
    if (target.targetType !== 'community') continue;
    const key = targetKey('community', target.targetId);
    for (const participant of await db.listParticipants(target.targetId)) {
      if (participant.checkedInAt) visitors.get(key)!.add(participant.userId);
    }
  }

  for (const key of wanted) {
    proofs[key].beenCount = visitors.get(key)!.size + (olderMoments.get(key) ?? 0);
    const given = ratings.get(key);
    if (given?.length) {
      proofs[key].rating = { average: Math.round((given.reduce((sum, r) => sum + r, 0) / given.length) * 10) / 10, count: given.length };
    }
  }
  return proofs;
}

/** Everything one member has been to, one entry per target with its strongest evidence */
export async function visitsOf(memberId: string): Promise<Visit[]> {
  const best = new Map<string, Visit>();
  const add = (visit: Visit) => {
    const key = targetKey(visit.targetType, visit.targetId);
    const current = best.get(key);
    if (!current || EVIDENCE_RANK[visit.evidence] > EVIDENCE_RANK[current.evidence]) best.set(key, visit);
  };

  for (const mark of store.read()) {
    if (mark.memberId === memberId) add({ targetType: mark.targetType, targetId: mark.targetId, evidence: 'marked', at: mark.createdAt });
  }

  const { items: moments } = await momentRepository.query({ statuses: ['published'], authorId: memberId, sort: 'newest', page: 1, limit: 500 });
  for (const moment of moments) {
    if (isVisitTargetType(moment.targetType) && moment.targetId && !moment.evidenceRejected) {
      add({ targetType: moment.targetType, targetId: moment.targetId, evidence: 'moment', at: moment.createdAt, pending: !evidencePassed(moment) || undefined });
    }
  }

  for (const participation of await db.listParticipations(memberId)) {
    const record = await db.getParticipant(participation.eventId, memberId);
    if (record?.checkedInAt) add({ targetType: 'community', targetId: participation.eventId, evidence: 'checkin', at: record.checkedInAt });
  }

  return [...best.values()].sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Reviews of a place or fair: ratings with words from members who marked they have been, newest first.
 * Going there on your own needs no proof (owner 2026-10-23), so these are personal reviews, not verified visits.
 */
export async function reviewsOf(targetType: 'spot' | 'fair', targetId: string, viewer: { blockedIds?: string[] } | null, limit = 10) {
  const blocked = new Set(viewer?.blockedIds ?? []);
  const marks = store.read().filter((m) => m.targetType === targetType && m.targetId === targetId && m.rating && !blocked.has(m.memberId));
  const withText = marks.filter((m) => m.review).sort((a, b) => (b.reviewedAt ?? b.createdAt).localeCompare(a.reviewedAt ?? a.createdAt)).slice(0, limit);
  const people = await Promise.all(withText.map((m) => memberRepository.findById(m.memberId)));
  return {
    count: marks.length,
    average: marks.length ? Math.round((marks.reduce((sum, m) => sum + (m.rating ?? 0), 0) / marks.length) * 10) / 10 : 0,
    reviews: withText.flatMap((m, i) => {
      const author = people[i];
      if (!author || author.status !== 'active') return [];
      return [{ id: m.id, authorId: m.memberId, authorName: tidyDisplayName(author.displayName).trim() || author.displayName, authorAvatar: author.avatarUrl ?? '', rating: m.rating!, text: m.review!, at: m.reviewedAt ?? m.createdAt }];
    }),
  };
}

/** The member's own marks, with the ratings they gave */
export const marksOf = (memberId: string) =>
  store.read().filter((m) => m.memberId === memberId).map(({ targetType, targetId, rating, createdAt }) => ({ targetType, targetId, rating, createdAt }));

export const markedVisitOf = (memberId: string, targetType: 'spot' | 'fair', targetId: string): MarkedVisit | undefined =>
  store.read().find((m) => m.memberId === memberId && m.targetType === targetType && m.targetId === targetId);

/** Marks (or updates the rating of) the member's visit; one per member per target */
export async function markVisit(memberId: string, targetType: 'spot' | 'fair', targetId: string, rating?: number, review?: string): Promise<MarkedVisit> {
  const existing = markedVisitOf(memberId, targetType, targetId);
  const saved: MarkedVisit = {
    id: existing?.id ?? `vis_${randomUUID()}`,
    memberId,
    targetType,
    targetId,
    rating: rating ?? existing?.rating,
    review: review !== undefined ? review || undefined : existing?.review,
    reviewedAt: review !== undefined ? new Date().toISOString() : existing?.reviewedAt,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await store.update((items) => [saved, ...items.filter((m) => m.id !== saved.id)]);
  return saved;
}

export async function unmarkVisit(memberId: string, targetType: 'spot' | 'fair', targetId: string): Promise<void> {
  await store.update((items) => items.filter((m) => !(m.memberId === memberId && m.targetType === targetType && m.targetId === targetId)));
}

/** Account deletion */
export async function removeVisitsBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((m) => m.memberId !== memberId));
}

