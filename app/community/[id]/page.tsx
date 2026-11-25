import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bundledEvent, getPublicEvent, isBundledEvent, relatedMeetups } from '@/lib/publicContent';
import { placeName } from '@/lib/placeName';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, eventJsonLd, jsonLdHtml } from '@/lib/structuredData';
import CommunityDetailView from './CommunityDetailView';
import { questionsOf } from '@/lib/social/eventQuestions';

type Props = { params: Promise<{ id: string }> };

// Cached on the CDN and rebuilt at most every 60 s (BE-472): guests and bots read the cached page, not the database.
// Seats change often: joining or a host edit rebuilds the page at once (refreshEventPage); other changes within a minute.
// Only public data is rendered here; anything about the viewer loads in the browser.
export const revalidate = 60;

// Empty list: no page is built at deploy time; each one is built on its first visit, then cached (Next ISR).
export async function generateStaticParams() {
  return [];
}

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
  // Both read together: the questions and the ตี้ under the page come with the HTML
  const [questions, related] = event ? await Promise.all([questionsOf(event.id, null), relatedMeetups(event)]) : [null, null];
  return (
    <>
      {structured && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(structured)} />}
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'ตี้', path: '/community' }, { name: titleOf(event.title), path }]))}
        />
      )}
      <CommunityDetailView initialEvent={event ?? bundledEvent(id)} initialQuestions={questions} initialRelated={related} />
    </>
  );
}
