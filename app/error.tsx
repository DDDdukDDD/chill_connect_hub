'use client';

import React, { useEffect } from 'react';
import { dialogButton } from '@/components/auth/DialogShell';

/** A page that fails on the server or in the browser says so kindly and offers a way on, instead of a blank screen */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <main className="min-h-[70dvh] flex flex-col items-center justify-center px-6 py-16 text-center bg-white">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">หน้านี้สะดุดไปนิดนึง</h1>
      <p className="mt-2 max-w-sm text-sm font-medium text-slate-600 leading-relaxed">ไม่ใช่ความผิดของคุณเลย ลองอีกครั้งได้ ถ้ายังไม่ได้ กลับไปหน้าแรกก่อนนะ</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button type="button" className={dialogButton.primary} onClick={reset}>ลองอีกครั้ง</button>
        {/* A full load on purpose: the page's own state may be what broke */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={dialogButton.quiet}>กลับหน้าแรก</a>
      </div>
    </main>
  );
}
