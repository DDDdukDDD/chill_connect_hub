import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicEvent, isBundledEvent } from '@/lib/publicContent';
import { placeName } from '@/lib/placeName';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, eventJsonLd, jsonLdHtml } from '@/lib/structuredData';
import CommunityDetailView from './CommunityDetailView';
import { questionsOf } from '@/lib/social/eventQuestions';

type Props = { params: Promise<{ id: string }> };

const titleOf = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getPublicEvent(decodeURIComponent((await params).id), 'community');
  if (!event) return { title: 'ตี้' };
  return pageMetadata({
    title: titleOf(event.title),
    description: metaDescription(`${event.date} · ${placeName(event.location)} · ${metaDescription(event.description, 300)}`),
    // One date of a recurring ตี้ points search engines at the series page
    path: `/community/${encodeURIComponent(event.seriesId ?? event.id)}`,
    image: event.image,
    type: 'article',
  });
}

// The meetup is read here so its title, date, place and description are in the server HTML
export default async function CommunityDetailPage({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const event = await getPublicEvent(id, 'community');
  // A real 404 for search engines when nothing has this id (sample events still render from bundled data)
  if (!event && !isBundledEvent(id)) notFound();
  const path = event ? `/community/${encodeURIComponent(event.id)}` : '';
  const structured = event ? eventJsonLd(event, path) : null;
  return (
    <>
      {structured && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(structured)} />}
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'ตี้', path: '/community' }, { name: titleOf(event.title), path }]))}
        />
      )}
      <CommunityDetailView initialEvent={event} initialQuestions={event ? await questionsOf(event.id, null) : null} />
    </>
  );
}
