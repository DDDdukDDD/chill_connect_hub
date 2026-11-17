'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Sends the person on to the invited page at once; the link stays for a browser that does not run scripts.
 * Opened inside LINE, the page goes on in Safari or Chrome instead (`openExternalBrowser=1`, owner 2026-11-17): there
 * Google sign-in works and the phone can add Chillwaa to its home screen (components/InstallSheet.tsx).
 */
export function InviteRedirect({ href }: { href: string }) {
  useEffect(() => {
    if (!/\bLine\//i.test(navigator.userAgent)) return window.location.replace(href);
    const url = new URL(href, window.location.origin);
    url.searchParams.set('openExternalBrowser', '1');
    window.location.replace(url.toString());
  }, [href]);
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-bold text-slate-900">กำลังเปิดคำชวน…</h1>
      <Link href={href} className="text-sm font-semibold text-[#2563EB] hover:underline">
        ถ้าไม่เปิดเอง กดตรงนี้
      </Link>
    </main>
  );
}
