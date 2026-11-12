import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MEMBER_SESSION_COOKIE } from '@/lib/members/session';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { listMoments, trendingHashtags } from '@/lib/moments/service';
import { hashtagHref } from '@/lib/moments/hashtags';
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
  // A hashtag has its own page since FEED_PLAN step 2
  const oldTag = one(params.tag);
  if (oldTag) redirect(hashtagHref(oldTag));

  const targetType = one(params.targetType);
  const targetId = one(params.targetId);
  const location = one(params.location);
  const place: ShowcasePlace | null = targetType && targetId ? { targetType, targetId, location: location || 'ที่นี่' } : location ? { location } : null;
  const type = one(params.type);
  const chip = !place && isMomentTarget(type) ? type : 'all';

  await ensureSampleMembers(); // development sample accounts for the sample posts
  const [list, trending, jar] = await Promise.all([
    listMoments(null, {
      // ทั้งหมด is popular mixed with new (the grid's next pages ask for the same)
      tab: !place && chip === 'all' ? 'mix' : undefined,
      targetType: place?.targetType ?? (chip === 'all' ? undefined : chip),
      targetId: place?.targetId,
      location: place && !place.targetId ? place.location : undefined,
      limit: 24,
    }),
    // The week's tags (not on one place's moments)
    place ? undefined : trendingHashtags(),
    cookies(),
  ]);
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
      <MomentShowcase
        initialMoments={moments}
        initialHasMore={list.pagination.hasNextPage}
        initialCursor={list.pagination.nextCursor}
        initialChip={chip}
        place={place}
        signedIn={jar.has(MEMBER_SESSION_COOKIE)}
        tags={trending?.tags.length ? trending : undefined}
      />
    </>
  );
}
