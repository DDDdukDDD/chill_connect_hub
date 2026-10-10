import fs from 'fs';
import os from 'os';
import path from 'path';
import { MOCK_POSTS } from '@/data/mockData';
import { IS_SERVERLESS } from '../db/databaseFile';
import { AsyncMutex } from '../db/mutex';
import type { Moment, MomentQuery, MomentRepository, MomentStatus } from './types';

/**
 * Prototype moments store: data/moments.json (gitignored: member content).
 * The first load seeds the bundled MOCK_POSTS as samples (isSample) so the feed is not empty.
 * On serverless hosts it lives in /tmp and does not persist.
 */
const FILE = IS_SERVERLESS ? path.join(os.tmpdir(), 'moments.json') : path.join(process.cwd(), 'data', 'moments.json');
const globalForMoments = globalThis as unknown as { _cchMoments?: Moment[]; _cchMomentsMutex?: AsyncMutex };
const mutex = (globalForMoments._cchMomentsMutex ??= new AsyncMutex());

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

function load(): Moment[] {
  if (globalForMoments._cchMoments) return globalForMoments._cchMoments;
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    globalForMoments._cchMoments = Array.isArray(parsed) ? parsed : [];
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
