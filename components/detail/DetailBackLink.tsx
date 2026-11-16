'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cameFromHome } from '@/lib/backFromHome';

/**
 * The back link at the top of a detail page: to the section's list, or "กลับหน้าหลัก" when the page was opened from
 * home (lib/backFromHome.ts). Back to home uses the browser's history, so the feed is where the reader left it.
 * The server renders the section link; the home case is known only in the browser.
 */
export function DetailBackLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [fromHome, setFromHome] = useState(false);
  useEffect(() => {
    // Read once the page is in the browser; the note lives in this tab's storage
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromHome(cameFromHome(pathname));
  }, [pathname]);
  return (
    <Link
      href={fromHome ? '/' : href}
      onClick={(event) => {
        if (!fromHome || window.history.length < 2) return;
        event.preventDefault();
        router.back();
      }}
      className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      {fromHome ? 'กลับหน้าหลัก' : label}
    </Link>
  );
}
