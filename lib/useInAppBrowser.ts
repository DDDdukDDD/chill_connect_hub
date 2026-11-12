'use client';

import { useEffect, useState } from 'react';
import { isInAppBrowser } from '@/lib/appClient';

/**
 * Inside LINE's, Facebook's or Instagram's own browser Google refuses to sign anyone in ("disallowed_useragent"), and
 * a ชวนไป link from LINE opens exactly there (2026-11-12). Sign-in screens hide Google there and, in LINE, offer the
 * same page in Safari or Chrome: LINE opens a link with `openExternalBrowser=1` outside the app.
 * Read after mount, so the server HTML and the first render agree.
 */
export function useInAppBrowser(): { inApp: boolean; externalHref: string | null } {
  const [state, setState] = useState<{ inApp: boolean; externalHref: string | null }>({ inApp: false, externalHref: null });
  useEffect(() => {
    if (!isInAppBrowser()) return;
    let externalHref: string | null = null;
    if (/\bLine\//i.test(navigator.userAgent)) {
      const url = new URL(window.location.href);
      url.searchParams.set('openExternalBrowser', '1');
      externalHref = url.toString();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser is only known after mount
    setState({ inApp: true, externalHref });
  }, []);
  return state;
}
