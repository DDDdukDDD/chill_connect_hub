import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { findPublicMoment } from '@/lib/moments/service';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdHtml, momentJsonLd } from '@/lib/structuredData';
import { MomentDetailView } from '@/components/moments/MomentDetailView';
import { momentTargetHref, momentTitle } from '@/components/moments/momentTargets';

type Props = { params: Promise<{ id: string }> };

const getMoment = cache(async (id: string) => {
  await ensureSampleMembers(); // development sample accounts for the sample posts
  return findPublicMoment(id);
});

/** "ไปมาแล้ว ร้านลับ ๆ …" → a title of about 60 characters, with the place when it fits */
function pageTitle(caption: string, place: string): string {
  const first = momentTitle(caption) || `โมเมนต์จาก ${place || 'เพื่อนๆ'}`;
  const short = first.length > 60 ? `${first.slice(0, 58).trim()}…` : first;
  return place && !short.includes(place) && short.length + place.length < 80 ? `${short} · ${place}` : short;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const moment = await getMoment(decodeURIComponent((await params).id));
  if (!moment) return { title: 'โมเมนต์', robots: { index: false } };
  const place = moment.targetTitle || moment.location;
  return pageMetadata({
    title: pageTitle(moment.caption, place),
    description: metaDescription(`${moment.caption} — โมเมนต์จาก ${moment.userName}${place ? ` ที่ ${place}` : ''}`),
    path: `/moments/${encodeURIComponent(moment.id)}`,
    image: moment.images[0],
    type: 'article',
  });
}

// Public: the photos, caption, place and comments are in the server HTML; the member's likes and saves load in the browser
export default async function MomentPage({ params }: Props) {
  const moment = await getMoment(decodeURIComponent((await params).id));
  if (!moment) notFound();
  const path = `/moments/${encodeURIComponent(moment.id)}`;
  const aboutPath = momentTargetHref(moment.targetType, moment.targetId);
  const place = moment.targetTitle || moment.location;


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(momentJsonLd(moment, path, momentTitle(moment.caption) || `โมเมนต์จาก ${place}`, aboutPath))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'โมเมนต์', path: '/moments' }, { name: pageTitle(moment.caption, ''), path }]))}
      />
      <MomentDetailView initialMoment={moment} />
    </>
  );
}
