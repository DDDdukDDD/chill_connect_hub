import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getPageMember } from '@/lib/members/session';
import { getTrip } from '@/lib/trips/service';
import { daysBetween, itemPicture, subTrip, thaiDateRange, tripCover, tripParts, tripPlaces, visibleItems } from '@/lib/trips/story';
import { absoluteUrl, metaDescription, pageMetadata, SITE_NAME } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdHtml } from '@/lib/structuredData';
import { TripPage } from '@/components/trips/TripPage';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ play?: string; leg?: string }> };

const loadTrip = cache(async (id: string) => getTrip(id, await getPageMember()));

const isPublic = (trip: { status: string; visibility: string }) => trip.status === 'published' && trip.visibility === 'public';

function describe(trip: NonNullable<Awaited<ReturnType<typeof loadTrip>>>): string {
  const { cities } = tripPlaces(trip);
  return metaDescription(
    `${trip.intro ? `${trip.intro} — ` : ''}เรื่องเล่าทริปของ ${trip.author.name} ${thaiDateRange(trip.startsOn, trip.endsOn)}${cities.length ? ` · ${cities.join(' → ')}` : ''} · ${visibleItems(trip).length} โมเมนต์`,
  );
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const full = await loadTrip((await params).id);
  if (!full) return { title: 'ทริป', robots: { index: false } };
  // A sub-trip's link (?leg=) previews as that sub-trip; search keeps the whole trip as the page (canonical)
  const legId = (await searchParams).leg;
  const leg = legId ? subTrip(full, legId) : null;
  const trip = leg ?? full;
  const cover = tripCover(trip);
  const meta = pageMetadata({ title: leg ? `${leg.title} · ${full.title}` : trip.title, description: describe(trip), path: `/trips/${full.id}`, image: cover ? itemPicture(cover) : undefined, type: 'article' });
  // Drafts and trips for followers only stay out of search
  return isPublic(trip) ? meta : { ...meta, robots: { index: false, follow: false } };
}

// The trip's title, days, cities, photos and captions are in the server HTML; the player opens in the browser
export default async function TripStoryPage({ params, searchParams }: Props) {
  const trip = await loadTrip((await params).id);
  if (!trip) notFound();
  const path = `/trips/${trip.id}`;
  const query = await searchParams;
  const parts = tripParts(trip);
  const cover = tripCover(trip);

  return (
    <>
      {isPublic(trip) && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={jsonLdHtml({
              '@context': 'https://schema.org',
              '@type': 'TouristTrip',
              name: trip.title,
              description: describe(trip),
              url: absoluteUrl(path),
              ...(cover ? { image: itemPicture(cover) } : {}),
              author: { '@type': 'Person', name: trip.author.name },
              publisher: { '@type': 'Organization', name: SITE_NAME },
              ...(trip.publishedAt ? { datePublished: trip.publishedAt } : {}),
              itinerary: {
                '@type': 'ItemList',
                itemListElement: parts
                  .filter((p) => p.city)
                  .map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Place', name: p.city }, name: `${p.city} ${daysBetween(p.from, p.to) + 1} วัน` })),
              },
            })}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'โมเมนต์', path: '/moments' }, { name: trip.title, path }]))}
          />
        </>
      )}
      <TripPage trip={trip} autoplay={query.play === '1'} legId={query.leg} />
    </>
  );
}
