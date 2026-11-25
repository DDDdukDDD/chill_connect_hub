'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Vercel Web Analytics (page views) and Speed Insights (real visitors' page speed), BE-473.
 * Both are cookieless and keep no account or name; the privacy policy says so (TermsPrivacyModal, section 4).
 * Before anything leaves the browser, the URL loses its query and hash (reset and confirm tokens, share and invite
 * codes, profile ids) and invite codes in the path; staff pages are not counted.
 */
function cleanUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.pathname.startsWith('/admin')) return null;
    const path = url.pathname.replace(/^\/i\/[^/]+/, '/i/[code]');
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

function cleanPageView(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = cleanUrl(event.url);
  return url ? { ...event, url } : null;
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={cleanPageView} />
      <SpeedInsights
        beforeSend={(event) => {
          const url = cleanUrl(event.url);
          return url ? { ...event, url } : null;
        }}
      />
    </>
  );
}
