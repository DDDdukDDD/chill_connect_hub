'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { PhraseText } from '@/components/auth/PhraseText';
import { memberActions } from '@/lib/useMemberSession';

type State = { status: 'working' } | { status: 'done' } | { status: 'error'; message: string };

export function VerifyEmailScreen({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? { status: 'working' } : { status: 'error', message: 'ลิงก์ไม่ครบ กรุณาเปิดลิงก์จากอีเมลอีกครั้ง' });

  useEffect(() => {
    if (!token) return;
    let active = true;
    memberActions
      .confirmEmailVerification(token)
      .then(() => {
        try {
          sessionStorage.removeItem('cch_dev_verify_url');
        } catch {
          /* storage unavailable */
        }
        if (active) setState({ status: 'done' });
      })
      .catch((err) => {
        if (active) setState({ status: 'error', message: err instanceof Error ? err.message : 'ยืนยันอีเมลไม่สำเร็จ' });
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 border-b border-[#E8E2D8] bg-white/80">
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-[#1E293B]">Chill & Connect Hub</span>
        </Link>
      </header>
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-10 flex flex-col justify-center">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-7 sm:p-10 text-center">
          {state.status === 'working' && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-slate-500" role="status">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              กำลังยืนยันอีเมล…
            </p>
          )}
          {state.status === 'done' && (
            <>
              <span className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5 border border-emerald-200">
                <MailCheck className="w-8 h-8" aria-hidden="true" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">ยืนยันอีเมลแล้ว</h1>
              <p className="text-sm text-slate-500 font-medium mt-2 mb-6">
                <PhraseText text="ตอนนี้คุณโพสต์โมเมนต์ และคอมเมนต์ได้แล้ว" />
              </p>
              <Link href="/profile" className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm sm:text-base font-extrabold shadow-sm">
                ไปที่โปรไฟล์ของฉัน
              </Link>
            </>
          )}
          {state.status === 'error' && (
            <>
              <span className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-5 border border-rose-200">
                <AlertCircle className="w-8 h-8" aria-hidden="true" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">ยืนยันไม่สำเร็จ</h1>
              <p className="text-sm text-slate-600 font-medium mt-2 mb-6" role="alert">
                <PhraseText text={state.message} />
              </p>
              <Link href="/profile#trust" className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-extrabold">
                ขอลิงก์ใหม่ที่หน้าโปรไฟล์
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
