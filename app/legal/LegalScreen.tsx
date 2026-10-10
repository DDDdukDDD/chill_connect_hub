'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { PhraseText } from '@/components/auth/PhraseText';
import { LEGAL_VERSION_NOTE, LegalBody, LegalTabs, type Tab } from '@/components/TermsPrivacyModal';

export function LegalScreen({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between gap-3 border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-[#1E293B] truncate">Chill & Connect Hub</span>
        </Link>
        <Link href="/" className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          กลับหน้าแรก
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-5 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">ข้อตกลงและนโยบาย</h1>
          <div className="mt-4 mb-6">
            <LegalTabs tab={tab} onChange={setTab} />
          </div>
          <div className="space-y-5" role="tabpanel">
            <LegalBody tab={tab} />
          </div>
          <p className="mt-8 pt-5 border-t border-slate-100 text-xs font-medium text-slate-500">
            <PhraseText text={LEGAL_VERSION_NOTE} />
          </p>
        </div>
      </main>
    </div>
  );
}
