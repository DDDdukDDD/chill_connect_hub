import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { nearestStations, stationsText } from '@/lib/transit/nearestStations';
import { getPublicSpot, isBundledSpot } from '@/lib/publicContent';
import { MOCK_SPOTS, getSpotById } from '@/data/spotsData';
import { nearbyPool } from '@/lib/spotBrowse';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdHtml, placeJsonLd } from '@/lib/structuredData';
import SpotDetailView from './SpotDetailView';

type Props = { params: Promise<{ id: string }> };

// Cached on the CDN and rebuilt at most every 600 s (BE-472): guests and bots read the cached page, not the database.
// Staff edits to a place show within 10 minutes.
// Only public data is rendered here; anything about the viewer loads in the browser.
export const revalidate = 600;

// Empty list: no page is built at deploy time; each one is built on its first visit, then cached (Next ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spot = await getPublicSpot(decodeURIComponent((await params).id));
  if (!spot) return { title: 'ที่เที่ยว' };
  const meta = pageMetadata({
    title: `${spot.title} (${spot.province})`,
    description: metaDescription(`${spot.categoryLabel} · ${[spot.district, spot.province].filter(Boolean).join(', ')} · ${metaDescription([spot.vibeIntro, spot.description].filter(Boolean).join(' '), 300)}`),
    path: `/spots/${encodeURIComponent(spot.id)}`,
    image: spot.image,
    type: 'article',
  });
  // A chain branch is a meeting point, not a page worth finding (BE-424)
  return spot.chainBrand ? { ...meta, robots: { index: false, follow: true } } : meta;
}

// The place is read here so its name, area, hours and description are in the server HTML
export default async function SpotDetailPage({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const spot = await getPublicSpot(id);
  // A real 404 for search engines when nothing has this id (sample places still render from bundled data)
  if (!spot && !isBundledSpot(id)) notFound();
  // A bundled sample place is looked up here, so the browser does not need the sample data (~400 KB)
  const shown = spot ?? getSpotById(id) ?? MOCK_SPOTS.find((s) => s.title === id) ?? null;
  // Only the nearby candidates, not the whole catalog (it was ~7 MB in the browser)
  const pool = shown ? await nearbyPool(shown) : undefined;
  const path = spot ? `/spots/${encodeURIComponent(spot.id)}` : '';
  return (
    <>
      {spot && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(placeJsonLd(spot, path))} />}
      {spot && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([{ name: 'ที่เที่ยว', path: '/spots' }, { name: spot.title, path }]))}
        />
      )}
      <SpotDetailView initialSpot={shown} nearbyPool={pool} stationsText={shown ? stationsText(nearestStations(shown.latitude, shown.longitude)) : ''} />
    </>
  );
}
