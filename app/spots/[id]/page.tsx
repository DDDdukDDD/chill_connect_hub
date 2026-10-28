import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSpot, isBundledSpot } from '@/lib/publicContent';
import { MOCK_SPOTS, getSpotById } from '@/data/spotsData';
import { nearbyPool } from '@/lib/spotBrowse';
import { metaDescription, pageMetadata } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdHtml, placeJsonLd } from '@/lib/structuredData';
import SpotDetailView from './SpotDetailView';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spot = await getPublicSpot(decodeURIComponent((await params).id));
  if (!spot) return { title: 'ที่เที่ยว' };
  return pageMetadata({
    title: `${spot.title} (${spot.province})`,
    description: metaDescription(`${spot.categoryLabel} · ${[spot.district, spot.province].filter(Boolean).join(', ')} · ${metaDescription(spot.description, 300)}`),
    path: `/spots/${encodeURIComponent(spot.id)}`,
    image: spot.image,
    type: 'article',
  });
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
      <SpotDetailView initialSpot={shown} nearbyPool={pool} />
    </>
  );
}
