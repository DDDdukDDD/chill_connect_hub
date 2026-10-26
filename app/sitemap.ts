import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { isEventEnded } from '@/lib/dateUtils';
import { absoluteUrl } from '@/lib/site';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { listMoments, type FeedItem } from '@/lib/moments/service';

// Built on request so new meetups, fairs and places show up without a deploy; cached for an hour
export const revalidate = 3600;

/** Public pages only. Signed-in pages (my hub, profile, onboarding) and auth screens stay out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, changeFrequency: 'daily' | 'weekly' | 'monthly', priority: number): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  const staticPages = [
    page('/', 'daily', 1),
    page('/community', 'daily', 0.9),
    page('/challenges', 'daily', 0.9),
    page('/events', 'daily', 0.85),
    page('/spots', 'weekly', 0.85),
    page('/moments', 'daily', 0.7),
    page('/about', 'monthly', 0.5),
    page('/safety', 'monthly', 0.5),
    page('/legal', 'monthly', 0.3),
  ];

  const [events, quests, spots, moments] = await Promise.all([db.listAllEvents(), db.findQuests({ status: 'all', limit: 100 }), allPublishedSpots(), allPublicMoments()]);

  const eventPages = events
    .filter((e) => !isEventEnded(e))
    .map((e) => page(`/${e.eventType === 'public_venue' ? 'events' : 'community'}/${encodeURIComponent(e.id)}`, 'daily', 0.8));
  const questPages = quests.items
    .filter((q) => q.status !== 'draft' && q.status !== 'ended')
    .map((q) => page(`/challenges/${encodeURIComponent(q.id)}`, 'weekly', 0.7));
  const spotPages = spots.map((s) => page(`/spots/${encodeURIComponent(s.id)}`, 'monthly', 0.6));

  // Members' moments: published only (hidden, removed and banned authors' posts drop out)
  const momentPages = moments.map((m) => ({ ...page(`/moments/${encodeURIComponent(m.id)}`, 'weekly', 0.5), lastModified: new Date(m.createdAt) }));

  return [...staticPages, ...eventPages, ...questPages, ...spotPages, ...momentPages];
}

async function allPublicMoments(): Promise<FeedItem[]> {
  const moments: FeedItem[] = [];
  for (let p = 1; ; p++) {
    const res = await listMoments(null, { page: p, limit: 30 });
    moments.push(...res.moments);
    if (!res.pagination.hasNextPage) return moments;
  }
}

async function allPublishedSpots(): Promise<LifestyleSpotItem[]> {
  const spots: LifestyleSpotItem[] = [];
  for (let p = 1; ; p++) {
    const res = await db.findSpots({ page: p, limit: 100 });
    spots.push(...res.items.filter((s) => s.publicationStatus !== 'draft'));
    if (p >= res.totalPages) return spots;
  }
}
