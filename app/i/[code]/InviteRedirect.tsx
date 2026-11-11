'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/** Sends the person on to the invited page at once; the link stays for a browser that does not run scripts */
export function InviteRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
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
