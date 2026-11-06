'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { campaignStanding } from '@/components/campaigns/campaignStanding';
import { campaignDay, isCampaignLive, type MyCampaign } from '@/lib/campaigns/types';
import { optimizedImage } from '@/lib/optimizedImage';
import type { useMyRewards } from '@/lib/useMyRewards';

const SHOWN = 3;

/** "แคมเปญของฉัน": the campaigns the member joined, each opening its popup. Nothing shows without one (owner 2026-11-04) */
export function MyCampaignsSection({ campaigns, rewards, onOpen }: { campaigns: MyCampaign[]; rewards: ReturnType<typeof useMyRewards>; onOpen: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  if (campaigns.length === 0) return null;
  const shown = showAll ? campaigns : campaigns.slice(0, SHOWN);

  return (
    <section aria-label="แคมเปญของฉัน">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">แคมเปญของฉัน</h2>
        {campaigns.length > SHOWN && (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="py-2 -my-2 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap tabular-nums">
            {showAll ? 'แสดงน้อยลง' : `ดูทั้งหมด ${campaigns.length}`}
          </button>
        )}
      </div>
      <ul className="mt-1 divide-y divide-slate-100">
        {shown.map(({ campaign, win, resultsOut }) => {
          const { prize, short, entered, ready, done, total } = campaignStanding(campaign, rewards);
          const status = win
            ? { pending: win.expired ? 'เลยกำหนดยืนยันรับรางวัลแล้ว' : 'ยินดีด้วย คุณคือผู้โชคดี กดยืนยันรับรางวัล', claimed: 'ยืนยันรับรางวัลแล้ว รอทีมงานติดต่อ', confirmed: 'รับรางวัลเรียบร้อยแล้ว', forfeited: 'สิทธิ์รับรางวัลหมดแล้ว' }[win.status]
            : resultsOut
              ? 'ประกาศผลแล้ว กดดูผลได้เลย'
              : entered
            ? `คุณมีสิทธิ์ลุ้นแล้ว${prize?.drawEntry ? ` · ประกาศผล ${prize.drawEntry.drawLabel}` : ''}`
            : ready
              ? 'XP ครบแล้ว แลกสิทธิ์ลุ้นได้เลย'
              : !isCampaignLive(campaign)
                ? `จบแล้ว ${campaignDay(campaign.endDate)}`
                : `ทำแล้ว ${done}/${total} ชาเลนจ์${prize ? ` · อีก ${short.toLocaleString()} XP` : ''} · ถึง ${campaignDay(campaign.endDate)}`;
          return (
            <li key={campaign.id}>
              <button type="button" onClick={() => onOpen(campaign.id)} className="w-full text-left py-2.5 flex items-center gap-3 group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedImage(campaign.prizeImage, 128) || undefined} alt="" className="w-14 h-14 rounded-xl object-contain bg-amber-50 p-1 shrink-0" />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-[11px] font-bold text-[#C2410C]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F26430] mr-1.5 align-middle" aria-hidden="true" />
                    แคมเปญ
                  </span>
                  <span className="block text-sm font-bold text-slate-900 truncate group-hover:underline">{campaign.headline}</span>
                  <span className="block text-xs font-medium text-slate-500 tabular-nums truncate">{status}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
