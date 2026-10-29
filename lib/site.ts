import type { Metadata } from 'next';

/** The public address of the site. Set NEXT_PUBLIC_SITE_URL to override it (preview deploys). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://chillconnecthub.com').replace(/\/$/, '');
export const SITE_NAME = 'Chill & Connect Hub';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Plain text for a meta description: tags stripped, spaces collapsed, cut at a word near `max` characters. */
export function metaDescription(text: string | undefined, max = 160): string {
  const plain = (text || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`;
}

/** The site's share picture (also in app/layout.tsx), for pages without a picture of their own */
const DEFAULT_SHARE_IMAGE = '/hero-bg-70.png';

/** Title, description, canonical address and share preview for one public page. Without an image the site's own is
 *  used: setting openGraph here replaces the root layout's, picture included, so list pages shared as a bare link. */
export function pageMetadata({ title, description, path, image, type = 'website' }: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  // The full title is set here: a layout in between (e.g. /community) would otherwise drop the root template
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'th_TH',
      type,
      images: [image || DEFAULT_SHARE_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description, images: [image || DEFAULT_SHARE_IMAGE] },
  };
}

/** For signed-in, utility and preview pages: kept out of search results. */
export const PRIVATE_PAGE: Metadata = { robots: { index: false, follow: false } };
