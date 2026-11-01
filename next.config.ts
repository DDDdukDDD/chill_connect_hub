import type { NextConfig } from "next";
import { OPTIMIZED_REMOTE_IMAGES } from './lib/optimizedImage';

const isDev = process.env.NODE_ENV === 'development';

// A static policy, not per-request nonces: nonces would force every page to render on each request (no caching).
// Scripts and API calls stay on this site; images may come from any https host (organizers' and scraped images);
// frames only for Google Maps.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  // data:/blob: are photos already in the browser (the upload compressor fetches its own data: URL); a moment's clip goes straight to Vercel Blob
  "connect-src 'self' data: blob: https://vercel.com https://*.blob.vercel-storage.com",
  // Map embeds on detail pages (maps.google.com redirects to www.google.com/maps)
  'frame-src https://maps.google.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Location is used on this site (nearby places); camera and microphone are not
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js": it tells attackers the framework for free
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Organisers' posters resized for cards (lib/optimizedImage.ts); only these hosts, never any URL
    remotePatterns: OPTIMIZED_REMOTE_IMAGES.map((p) => ({ protocol: 'https' as const, hostname: p.hostname, pathname: p.pathname })),
  },
  experimental: {
    // A page seen in the last 30 s opens again from the browser's router cache instead of a new server render
    // (Next 15+ default is 0); members' own data still refreshes on the page itself
    staleTimes: { dynamic: 30 },
  },
  async redirects() {
    return [
      // 1. ชาเลนจ์ & ภารกิจ (Singular & Quest aliases)
      { source: '/challenge', destination: '/challenges', permanent: true },
      { source: '/quest', destination: '/challenges', permanent: true },
      { source: '/quests', destination: '/challenges', permanent: true },

      // 2. โมเมนต์ & โซเชียล (Singular & Feed aliases)
      { source: '/moment', destination: '/moments', permanent: true },
      { source: '/feed', destination: '/moments', permanent: true },
      { source: '/stories', destination: '/moments', permanent: true },

      // 3. กิจกรรม & อีเวนต์ (Direct event aliases to catalog)
      { source: '/event', destination: '/', permanent: true },
      // The /journey homepage draft became the home page (2026-10-16)
      { source: '/journey', destination: '/', permanent: false },
      // อีเวนต์ moved from /fairs to /events (owner 2026-10-25)
      { source: '/fairs', destination: '/events', permanent: true },
      { source: '/fairs/:id', destination: '/events/:id', permanent: true },

      // 4. มายฮับ & E-Ticket (User personal hub & ticket aliases)
      { source: '/hub', destination: '/myhub', permanent: true },
      { source: '/ticket', destination: '/myhub', permanent: true },
      { source: '/tickets', destination: '/myhub', permanent: true },

      // 5. สมาชิก & ระบบบัญชี (Standard auth & profile aliases)
      { source: '/signin', destination: '/login', permanent: true },
      { source: '/signup', destination: '/login', permanent: true },
      { source: '/register', destination: '/login', permanent: true },
      { source: '/me', destination: '/profile', permanent: true },
      { source: '/account', destination: '/profile', permanent: true },
    ];
  },
};

export default nextConfig;
