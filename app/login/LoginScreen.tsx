'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { useMemberSession } from '@/lib/useMemberSession';

export function LoginScreen({ initialView, returnTo, initialError }: { initialView: 'login' | 'signup'; returnTo: string; initialError: string }) {
  const router = useRouter();
  const { isLoaded, member } = useMemberSession();
  const navigating = useRef(false);

  // Already signed in (e.g. opened /login in a second tab): continue
  useEffect(() => {
    if (isLoaded && member && !navigating.current) router.replace(returnTo);
  }, [isLoaded, member, returnTo, router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-[#1E293B] leading-tight">Chill & Connect Hub</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>กลับหน้าแรก</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[520px] mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-7 sm:p-10">
          {isLoaded && member ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500" role="status">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>เข้าสู่ระบบแล้ว กำลังพาไปต่อ…</span>
            </div>
          ) : (
            <AuthPanel
              initialView={initialView}
              returnTo={returnTo}
              initialError={initialError}
              onAuthenticated={(_member, { isNew }) => {
                navigating.current = true;
                router.push(isNew ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}` : returnTo);
              }}
            />
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-[#E8E2D8] bg-white/50">
        Chill & Connect Hub © 2026
      </footer>
    </div>
  );
}
