import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicEvent, isBundledEvent } from '@/lib/publicContent';
import { formatEventDateRange } from '@/lib/dateUtils';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, eventJsonLd, jsonLdHtml } from '@/lib/structuredData';
import FairDetailView from './FairDetailView';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getPublicEvent(decodeURIComponent((await params).id), 'public_venue');
  if (!event) return { title: 'อีเวนต์และอีเวนต์' };
  return pageMetadata({
    title: event.title,
    description: metaDescription(`${formatEventDateRange(event)} · ${event.location} · ${metaDescription(event.description, 300)}`),
    path: `/events/${encodeURIComponent(event.id)}`,
    image: event.image,
    type: 'article',
  });
}

// The fair is read here so its title, dates, venue and description are in the server HTML
export default async function FairDetailPage({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const event = await getPublicEvent(id, 'public_venue');
  // Old /events/<id> links also pointed at ตี้; send those to their own page
  if (!event && (await getPublicEvent(id, 'community'))) permanentRedirect(`/community/${encodeURIComponent(id)}`);
  // A real 404 for search engines when nothing has this id (sample events still render from bundled data)
  if (!event && !isBundledEvent(id)) notFound();
  const path = event ? `/events/${encodeURIComponent(event.id)}` : '';
  const structured = event ? eventJsonLd(event, path) : null;
  return (
    <>
      {structured && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(structured)} />}
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'อีเวนต์', path: '/events' }, { name: event.title, path }]))}
        />
      )}
      <FairDetailView initialEvent={event} />
    </>
  );
}
