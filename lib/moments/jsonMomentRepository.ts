import fs from 'fs';
import os from 'os';
import path from 'path';
import { MOCK_POSTS } from '@/data/mockData';
import { IS_SERVERLESS } from '../db/databaseFile';
import { AsyncMutex } from '../db/mutex';
import { isPlaceMoment } from './feedRules';
import { hasHashtag } from './hashtags';
import type { Moment, MomentFeedQuery, MomentQuery, MomentRepository, MomentStatus } from './types';

/**
 * Prototype moments store: data/moments.json (gitignored: member content).
 * The first load seeds the bundled MOCK_POSTS as samples (isSample) so the feed is not empty.
 * On serverless hosts it lives in /tmp and does not persist.
 */
const FILE = IS_SERVERLESS ? path.join(os.tmpdir(), 'moments.json') : path.join(process.cwd(), 'data', 'moments.json');
const globalForMoments = globalThis as unknown as { _cchMoments?: Moment[]; _cchMomentsMutex?: AsyncMutex };
const mutex = (globalForMoments._cchMomentsMutex ??= new AsyncMutex());

/** Width / height of each sample's first photo (measured from the files in public/), so the /moments grid shows their real shapes */
const SAMPLE_IMAGE_RATIOS: Record<string, number> = {
  'post-spot-1': 1.792, 'post-general-1': 1.46, 'post-fair-1': 1.501, 'post-4': 1.501, 'post-challenge-1': 1.501, 'post-1': 1, 'post-2': 1,
  'post-3': 1, 'post-5': 1.501, 'post-6': 1.501, 'post-7': 0.667, 'post-8': 1, 'post-9': 0.667, 'post-10': 0.667, 'post-11': 1.333,
  'post-12': 1.501, 'post-13': 1.384, 'post-14': 1.547, 'post-15': 1.498, 'post-16': 1.581, 'post-17': 1.504, 'post-18': 1.501,
  'post-19': 1, 'post-20': 1.333,
};

function seedSamples(): Moment[] {
  const now = Date.now();
  return MOCK_POSTS.map((post, index) => {
    // Spread the samples over the last days so "newest" ordering stays stable
    const createdAt = new Date(now - (index + 1) * 5 * 60 * 60 * 1000).toISOString();
    return {
      id: `sample-${post.id}`,
      authorId: null,
      authorName: post.userName,
      authorAvatar: post.userAvatar,
      authorBadge: post.userBadge,
      caption: post.caption,
      images: post.images,
      imageRatio: SAMPLE_IMAGE_RATIOS[post.id],
      location: post.location,
      category: post.category,
      targetType: post.targetType ?? 'general',
      targetId: post.targetId,
      targetTitle: post.targetTitle ?? post.eventTitle,
      likedBy: [],
      savedBy: [],
      sampleLikes: post.likesCount ?? 0,
      comments: (post.comments ?? []).map((comment, commentIndex) => ({
        id: `sample-${comment.id}`,
        authorId: null,
        authorName: comment.userName,
        authorAvatar: comment.userAvatar,
        text: comment.text || comment.content || '',
        createdAt: new Date(new Date(createdAt).getTime() + (commentIndex + 1) * 20 * 60 * 1000).toISOString(),
      })),
      reports: [],
      status: 'published' as const,
      isSample: true,
      createdAt,
    };
  });
}

/**
 * Stored samples follow the bundled ones in what they are tied to (place or event, and the location text)
 * and in their photo shape, so a store seeded earlier picks up new links. Sample comments added to the bundle later are
 * added too (members' own comments stay). Everything else on a stored sample is left alone.
 */
function syncSampleTargets(moments: Moment[]): { moments: Moment[]; changed: boolean } {
  const seedById = new Map(seedSamples().map((seed) => [seed.id, seed]));
  let changed = false;
  const synced = moments.map((moment) => {
    const seed = moment.isSample ? seedById.get(moment.id) : undefined;
    if (!seed) return moment;
    const known = new Set(moment.comments.map((comment) => comment.id));
    const newSampleComments = seed.comments
      .map((comment, index) => ({ ...comment, createdAt: new Date(new Date(moment.createdAt).getTime() + (index + 1) * 20 * 60 * 1000).toISOString() }))
      .filter((comment) => !known.has(comment.id));
    if (
      newSampleComments.length === 0 &&
      moment.targetType === seed.targetType && moment.targetId === seed.targetId && moment.targetTitle === seed.targetTitle && moment.location === seed.location && moment.imageRatio === seed.imageRatio
    )
      return moment;
    changed = true;
    const comments = [...moment.comments, ...newSampleComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { ...moment, targetType: seed.targetType, targetId: seed.targetId, targetTitle: seed.targetTitle, location: seed.location, imageRatio: seed.imageRatio, comments };
  });
  return { moments: synced, changed };
}

function load(): Moment[] {
  if (globalForMoments._cchMoments) return globalForMoments._cchMoments;
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    const synced = syncSampleTargets(Array.isArray(parsed) ? parsed : []);
    globalForMoments._cchMoments = synced.moments;
    if (synced.changed) persist(synced.moments);
  } catch {
    globalForMoments._cchMoments = seedSamples();
    persist(globalForMoments._cchMoments);
  }
  return globalForMoments._cchMoments;
}

function persist(moments: Moment[]) {
  globalForMoments._cchMoments = moments;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(moments, null, 2), 'utf-8');
  } catch (error) {
    console.error('MOMENTS WRITE FAILED:', error);
  }
}

const likeCount = (moment: Moment) => moment.likedBy.length + moment.sampleLikes;

/** Without the database, what each member saw is kept in this server's memory only: member id → moment id → when */
const seenByMember = new Map<string, Map<string, number>>();

export const jsonMomentRepository: MomentRepository = {
  async findById(id) {
    return load().find((m) => m.id === id) ?? null;
  },
  async create(moment) {
    return mutex.runExclusive(async () => {
      persist([moment, ...load()]);
      return moment;
    });
  },
  async mutate(id, change) {
    return mutex.runExclusive(async () => {
      const moments = load();
      const index = moments.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('ไม่พบโมเมนต์');
      const updated = change(structuredClone(moments[index]));
      persist(moments.map((m, i) => (i === index ? updated : m)));
      return updated;
    });
  },
  async remove(id) {
    return mutex.runExclusive(async () => {
      const moments = load();
      const next = moments.filter((m) => m.id !== id);
      if (next.length === moments.length) return false;
      persist(next);
      return true;
    });
  },
  async removeByAuthor(authorId) {
    return mutex.runExclusive(async () => {
      const moments = load();
      const next = moments.filter((m) => m.authorId !== authorId);
      persist(next);
      return moments.length - next.length;
    });
  },
  async removeCommentsByAuthor(authorId) {
    return mutex.runExclusive(async () => {
      let removed = 0;
      const next = load().map((m) => {
        const kept = m.comments.filter((c) => c.authorId !== authorId);
        removed += m.comments.length - kept.length;
        // Their likes, saves and reports go too
        return { ...m, comments: kept, likedBy: m.likedBy.filter((id) => id !== authorId), savedBy: m.savedBy.filter((id) => id !== authorId), reports: m.reports.filter((r) => r.memberId !== authorId) };
      });
      persist(next);
      return removed;
    });
  },
  // The no-database mode: everything is in memory already, so moments come whole, without feedFacts
  async feed(query: MomentFeedQuery) {
    const { memberRepository } = await import('../members');
    const q = query.q?.trim().toLowerCase();
    const location = query.location?.trim().toLowerCase();
    const authors = await memberRepository.findByIds(load().flatMap((m) => (m.authorId ? [m.authorId] : [])));
    const matches = load().filter((m) => {
      if (m.status !== 'published') return false;
      if (m.authorId && (authors.get(m.authorId)?.status ?? 'banned') === 'banned') return false;
      if (m.authorId && query.blockedIds?.includes(m.authorId)) return false;
      if (query.authorIds && !query.authorIds.includes(m.authorId ?? '')) return false;
      if (query.authorId && m.authorId !== query.authorId) return false;
      if (query.savedBy && !m.savedBy.includes(query.savedBy)) return false;
      if (query.targetType && m.targetType !== query.targetType) return false;
      if (query.targetId && m.targetId !== query.targetId) return false;
      if (query.category && m.category !== query.category) return false;
      if (query.placesOnly && !isPlaceMoment(m)) return false;
      if (query.tag && !hasHashtag(m.caption, query.tag)) return false;
      if (location && !m.location.toLowerCase().includes(location) && !(m.targetTitle ?? '').toLowerCase().includes(location)) return false;
      return !q || m.caption.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
    });
    const newest = (a: Moment, b: Moment) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
    const sorted = matches.sort((a, b) => (query.sort === 'popular' ? likeCount(b) + b.comments.length - (likeCount(a) + a.comments.length) || newest(a, b) : newest(a, b)));
    const usesCursor = query.sort === 'newest' && Boolean(query.cursor);
    const from = usesCursor ? sorted.findIndex((m) => `${m.createdAt}|${m.id}` === query.cursor) + 1 : (query.page - 1) * query.limit;
    if (usesCursor && from === 0) return { items: [], hasNext: false };
    const items = sorted.slice(from, from + query.limit);
    const hasNext = sorted.length > from + query.limit;
    const last = items[items.length - 1];
    return { items, ...(usesCursor ? {} : { totalCount: sorted.length }), hasNext, ...(hasNext && query.sort === 'newest' ? { nextCursor: `${last.createdAt}|${last.id}` } : {}) };
  },
  async forYouPool(query) {
    const { items } = await jsonMomentRepository.feed({ viewerId: query.viewerId, blockedIds: query.blockedIds, sort: 'newest', page: 1, limit: 5000 });
    const asOf = query.asOf.getTime();
    const seen = (query.viewerId && seenByMember.get(query.viewerId)) || new Map<string, number>();
    return items
      .filter((m) => Date.parse(m.createdAt) <= asOf)
      .slice(0, query.limit)
      .map((m) => ({
        id: m.id,
        authorId: m.authorId,
        createdAt: m.createdAt,
        likes: likeCount(m),
        saves: m.savedBy.length,
        comments: m.comments.length,
        isClip: Boolean(m.video),
        category: m.category,
        // Without the database the ตี้, places and challenges behind a post are not looked up
        targetCategories: [],
        joinable: false,
        isPlace: isPlaceMoment(m),
        seen: (seen.get(m.id) ?? Infinity) <= asOf,
        cursorAt: `${m.createdAt}|${m.id}`,
      }));
  },
  async readerAffinity(viewerId) {
    const counts = new Map<string, number>();
    for (const m of load()) {
      if (!m.authorId) continue;
      const times = (m.likedBy.includes(viewerId) ? 1 : 0) + m.comments.filter((c) => c.authorId === viewerId).length;
      if (times) counts.set(m.authorId, (counts.get(m.authorId) ?? 0) + times);
    }
    return counts;
  },
  async feedByIds(ids, query) {
    const { items } = await jsonMomentRepository.feed({ viewerId: query.viewerId, blockedIds: query.blockedIds, sort: 'newest', page: 1, limit: 5000 });
    const byId = new Map(items.map((m) => [m.id, m]));
    return ids.flatMap((id) => (byId.has(id) ? [byId.get(id) as Moment] : []));
  },
  async markSeen(viewerId, ids) {
    const seen = seenByMember.get(viewerId) ?? new Map<string, number>();
    for (const id of ids) seen.set(id, Date.now());
    seenByMember.set(viewerId, seen);
  },
  async typeCounts() {
    const { memberRepository } = await import('../members');
    const authors = await memberRepository.findByIds(load().flatMap((m) => (m.authorId ? [m.authorId] : [])));
    const counts = { all: 0, spot: 0, community: 0, fair: 0, challenge: 0 };
    for (const moment of load()) {
      if (moment.status !== 'published' || (moment.authorId && (authors.get(moment.authorId)?.status ?? 'banned') === 'banned')) continue;
      counts.all++;
      if (isPlaceMoment(moment)) counts.spot++;
      else if (moment.targetType in counts) counts[moment.targetType as keyof typeof counts]++;
    }
    return counts;
  },
  async query(query: MomentQuery) {
    const q = query.q?.trim().toLowerCase();
    const location = query.location?.trim().toLowerCase();
    const filtered = load().filter((m) =>
      query.statuses.includes(m.status) &&
      (!query.authorId || m.authorId === query.authorId) &&
      (!query.savedBy || m.savedBy.includes(query.savedBy)) &&
      (!query.targetType || m.targetType === query.targetType) &&
      (!query.targetId || m.targetId === query.targetId) &&
      (!location || m.location.toLowerCase().includes(location) || (m.targetTitle ?? '').toLowerCase().includes(location)) &&
      (!query.reportedOnly || m.reports.length > 0) &&
      (!q || m.caption.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q) || m.location.toLowerCase().includes(q))
    );
    const sorted = filtered.sort((a, b) =>
      query.sort === 'popular'
        ? likeCount(b) + b.comments.length - (likeCount(a) + a.comments.length) || b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
    return { items: sorted.slice((query.page - 1) * query.limit, query.page * query.limit), totalCount: sorted.length };
  },
  async counts() {
    const counts = { published: 0, hidden: 0, removed: 0, reported: 0, samples: 0 } as Record<MomentStatus | 'reported' | 'samples', number>;
    for (const m of load()) {
      counts[m.status] += 1;
      if (m.reports.length > 0 && m.status !== 'removed') counts.reported += 1;
      if (m.isSample) counts.samples += 1;
    }
    return counts;
  },
};
