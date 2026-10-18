import { redirect } from 'next/navigation';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { listMoments } from '@/lib/moments/service';
import { MomentShowcase, type ShowcasePlace } from '@/components/moments/MomentShowcase';
import { isMomentTarget } from '@/components/moments/momentTargets';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || undefined;

/**
 * /moments: the moments showcase. The first cards are built here so they are in the server HTML;
 * more cards and the type tabs load in the browser. Posting happens on Home.
 */
export default async function MomentsPage({ searchParams }: Props) {
  const params = await searchParams;

  // Links from before the showcase: one moment, or "share a moment from this event"
  const momentId = one(params.momentId);
  if (momentId) redirect(`/moments/${encodeURIComponent(momentId)}`);
  const shareId = one(params.createForEvent);
  if (shareId) {
    const type = one(params.createForType) ?? 'community';
    const share = new URLSearchParams({ share: `${type}:${shareId}`, title: one(params.eventTitle) ?? '', location: one(params.location) ?? '' });
    redirect(`/?${share}`);
  }

  const targetType = one(params.targetType);
  const targetId = one(params.targetId);
  const location = one(params.location);
  const place: ShowcasePlace | null = targetType && targetId ? { targetType, targetId, location: location || 'ที่นี่' } : location ? { location } : null;
  const type = one(params.type);
  const chip = !place && isMomentTarget(type) ? type : 'all';

  await ensureSampleMembers(); // development sample accounts for the sample posts
  const list = await listMoments(null, {
    targetType: place?.targetType ?? (chip === 'all' ? undefined : chip),
    targetId: place?.targetId,
    location: place && !place.targetId ? place.location : undefined,
    limit: 24,
  });

  return <MomentShowcase initialMoments={list.moments.filter((moment) => moment.images[0])} initialHasMore={list.pagination.hasNextPage} initialChip={chip} place={place} />;
}
