import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';
import { publicResults } from '@/lib/campaigns/draw';
import { optimizedImage } from '@/lib/optimizedImage';

export const metadata: Metadata = {
  title: 'ประกาศผลรางวัล',
  description: 'ผลการจับรางวัลจากแคมเปญของ Chillwaa ดูรหัสสิทธิ์ของผู้โชคดีแต่ละแคมเปญได้ที่นี่',
  alternates: { canonical: '/campaigns/results' },
};

// Staff announce at any moment, and the terms promise the result on the site, so this is never an old copy
export const dynamic = 'force-dynamic';

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });

/** The public results the draw prizes promise. Winners show by entry code and a masked name, never a full name (owner 2026-11-04) */
export default async function CampaignResultsPage() {
  const results = await publicResults();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between gap-3 border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="group flex items-center gap-2 min-w-0">
          <BrandLogo size="sm" />
          <BrandWordmark sizeClass="text-base sm:text-lg" />
        </Link>
        <Link href="/" className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          กลับหน้าหลัก
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ประกาศผลรางวัล</h1>
        <p className="mt-2 text-sm text-slate-600">สุ่มจากรหัสสิทธิ์ของสมาชิกทุกคนที่แลกไว้ เช็กรหัสของคุณได้ที่หน้าของรางวัล หากได้รางวัล เราจะแจ้งเตือนในเว็บและทางอีเมลที่ยืนยันแล้ว ทีมงานไม่ขอเงินหรือรหัสผ่านจากคุณ</p>

        {results.length === 0 ? (
          <div className="mt-8 text-center py-10">
            <p className="text-sm font-semibold text-slate-700">ยังไม่มีผลรางวัลตอนนี้</p>
            <Link href="/challenges" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#2563EB] hover:underline">ดูแคมเปญและชาเลนจ์ที่เปิดอยู่</Link>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[#E8E2D8]">
            {results.map((result) => (
              <section key={result.id} id={result.id} className="py-6 scroll-mt-4 flex flex-col sm:flex-row gap-4">
                {result.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
                  <img src={optimizedImage(result.image, 256)} alt={result.prizeTitle} className="w-full sm:w-40 h-28 shrink-0 rounded-2xl border border-[#F5E6B8] bg-white object-contain p-2" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold">{result.headline}</h2>
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {result.prizeTitle} · ประกาศ {dayOf(result.announcedAt)} · จาก {result.entries.toLocaleString()} สิทธิ์
                  </p>
                  {result.winners.length === 0 ? (
                    <p className="mt-3 text-sm font-medium text-slate-600">กำลังจับรางวัลใหม่ เพราะผู้โชคดีไม่ได้ยืนยันรับรางวัล</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {result.winners.map((winner) => (
                        <li key={winner.code} className="flex items-center gap-2.5 rounded-xl border-2 border-dashed border-[#FFC83D] bg-amber-50 px-3 py-2">
                          <PartyPopper className="w-4 h-4 shrink-0 text-[#F26430]" aria-hidden="true" />
                          <span className="font-mono font-bold tracking-wider">{winner.code}</span>
                          <span className="text-sm text-slate-600">คุณ {winner.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
