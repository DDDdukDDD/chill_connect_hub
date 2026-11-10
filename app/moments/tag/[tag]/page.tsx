import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { ensureSampleMembers } from '@/lib/members/sampleMembers';
import { listMoments, relatedHashtags, TAG_PAGE_MIN_POSTS } from '@/lib/moments/service';
import { HASHTAG, hashtagHref, normalTag } from '@/lib/moments/hashtags';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdHtml, momentCollectionJsonLd } from '@/lib/structuredData';
import { MomentShowcase } from '@/components/moments/MomentShowcase';

type Props = { params: Promise<{ tag: string }> };

/** The tag from the URL, or null when it could never be a hashtag (so the page is a 404, not an empty grid) */
function tagOf(raw: string): string | null {
  let tag: string;
  try {
    tag = normalTag(decodeURIComponent(raw));
  } catch {
    return null;
  }
  const match = `#${tag}`.match(HASHTAG);
  return match?.[0] === `#${tag}` && tag.length <= 60 ? tag : null;
}

const firstPage = cache(async (tag: string) => {
  await ensureSampleMembers(); // development sample accounts for the sample posts
  return listMoments(null, { tag, limit: 24 });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = tagOf((await params).tag);
  if (!tag) return { title: 'แท็ก', robots: { index: false } };
  const list = await firstPage(tag);
  const total = list.pagination.totalCount ?? list.moments.length;
  const cover = list.moments.find((m) => m.images[0])?.images[0];
  const metadata = pageMetadata({
    title: `#${tag} · โมเมนต์`,
    description: metaDescription(`${total.toLocaleString()} โมเมนต์ในแท็ก #${tag} ภาพจริงจากคนที่ไปมาแล้ว เห็นที่ไหนน่าไป แตะดูแล้วไปต่อได้เลย`),
    path: hashtagHref(tag),
    image: cover,
  });
  // A tag with only a post or two is thin for search; it still works for people who follow the link
  return total < TAG_PAGE_MIN_POSTS ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

/** /moments/tag/[tag]: one hashtag's moments (FEED_PLAN step 2), built on the server with the tags people use alongside it */
export default async function TagPage({ params }: Props) {
  const tag = tagOf((await params).tag);
  if (!tag) notFound();
  const [list, related] = await Promise.all([firstPage(tag), relatedHashtags(tag)]);
  const moments = list.moments.filter((moment) => moment.images[0]);
  const path = hashtagHref(tag);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(momentCollectionJsonLd(moments, path, `#${tag}`, `โมเมนต์ในแท็ก #${tag}`))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'โมเมนต์', path: '/moments' }, { name: `#${tag}`, path }]))} />
      <MomentShowcase
        initialMoments={moments}
        initialHasMore={list.pagination.hasNextPage}
        initialCursor={list.pagination.nextCursor}
        initialChip="all"
        place={{ tag, location: `#${tag}` }}
        total={list.pagination.totalCount}
        tags={related.length ? { kind: 'related', tags: related } : undefined}
      />
    </>
  );
}
