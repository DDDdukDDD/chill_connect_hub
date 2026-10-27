import { redirect } from 'next/navigation';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { countMomentsByType, listMoments } from '@/lib/moments/service';
import { jsonLdHtml, momentCollectionJsonLd } from '@/lib/structuredData';
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

  // A count beside each tab (not on one place's moments, which has no tabs)
  const counts = place ? undefined : await countMomentsByType();
  const moments = list.moments.filter((moment) => moment.images[0]);

  return (
    <>
      {/* The moments shown first, as a list search engines can read */}
      {!place && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdHtml(
            momentCollectionJsonLd(moments, '/moments', 'โมเมนต์จากเพื่อนๆ', 'ภาพจริงจากคนที่ไปมาแล้ว ทั้งที่เที่ยว ตี้ อีเวนต์ และชาเลนจ์ทั่วประเทศ')
          )}
        />
      )}
      <MomentShowcase initialMoments={moments} initialHasMore={list.pagination.hasNextPage} initialChip={chip} place={place} counts={counts} />
    </>
  );
}
