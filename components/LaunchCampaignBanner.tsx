'use client';

import Link from 'next/link';
import { Check, ChevronRight, Gift } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { type Campaign, campaignDay } from '@/lib/campaigns/types';
import type { QuestProgress } from '@/lib/useMyRewards';

interface LaunchCampaignBannerProps {
  /** The running campaign (lib/campaigns/store.ts liveCampaign, read on the server); null hides the banner */
  campaign: Campaign | null;
  /** The challenge catalog; the banner picks the campaign's challenges from it */
  quests: ChallengeQuest[];
  isLoggedIn: boolean;
  balance: number;
  progress: QuestProgress[];
  redeemedRewardIds: string[];
  onSignUp: () => void;
}

/**
 * The running campaign on /challenges: its step challenges and the XP they add up to for the prize draw.
 * Its one job: show a new member the path from here to the prize, and where they are on it.
 * The campaign's other challenges that run today follow as "more ways to earn XP".
 */
export function LaunchCampaignBanner({ campaign, quests, isLoggedIn, balance, progress, redeemedRewardIds, onSignUp }: LaunchCampaignBannerProps) {
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign?.rewardId);
  const steps = (campaign?.questIds ?? []).flatMap((id) => quests.filter((quest) => quest.id === id));
  if (!campaign || !prize || steps.length === 0) return null;
  const drawLabel = prize.drawEntry?.drawLabel;
  // Running today: started and not ended (the list carries both as derived fields)
  const extras = campaign.extraQuestIds
    .flatMap((id) => quests.filter((quest) => quest.id === id && !quest.startsInDays && quest.status !== 'ended'))
    .slice(0, 6);

  const entered = redeemedRewardIds.includes(prize.id);
  const short = Math.max(0, prize.costXp - balance);
  const percent = Math.min(100, Math.round((balance / prize.costXp) * 100));

  return (
    <section id="launch-campaign" aria-labelledby="launch-campaign-title" className="scroll-mt-24 rounded-3xl bg-[#FFD84D] text-slate-900 p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/80 items-center justify-center shrink-0">
          <Gift className="w-7 h-7" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-slate-700">{campaign.eyebrow} · ถึง {campaignDay(campaign.endDate)}</p>
          <h2 id="launch-campaign-title" className="mt-1 text-xl sm:text-2xl font-bold leading-tight tracking-tight">{campaign.headline}</h2>
          <p className="mt-1.5 text-sm font-medium text-slate-800 leading-relaxed">{campaign.text}</p>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {steps.map((quest, index) => {
          const mine = progress.find((item) => item.questId === quest.id);
          const done = Boolean(mine?.completed && mine.joined);
          return (
            <li key={quest.id}>
              <Link href={`/challenges/${quest.id}`} className="h-full flex items-center gap-3 rounded-2xl bg-white/75 hover:bg-white p-3 transition-colors">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {done ? <Check className="w-4 h-4" aria-label="ทำครบแล้ว" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug line-clamp-2">{quest.title}</span>
                  <span className="block text-xs font-medium text-slate-600 tabular-nums">
                    {mine && isLoggedIn && !done ? `${mine.current}/${mine.total} · ` : ''}+{quest.rewardPoints ?? 0} XP
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>

      {extras.length > 0 && (
        <div className="mt-4">
          <p className="text-xs sm:text-sm font-bold text-slate-700">สะสม XP เพิ่มได้อีก</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {extras.map((quest) => (
              <li key={quest.id}>
                <Link href={`/challenges/${quest.id}`} className="inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full bg-white/75 hover:bg-white text-xs sm:text-sm font-bold">
                  {quest.title.split(':')[0]}
                  <span className="text-slate-600 tabular-nums">+{quest.rewardPoints ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        {isLoggedIn ? (
          <>
            {entered ? (
              <p className="flex-1 text-sm font-bold">คุณมีสิทธิ์ลุ้นแล้ว{drawLabel ? ` · ประกาศผล ${drawLabel}` : ''}</p>
            ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between text-sm font-bold tabular-nums">
                <span>XP ของฉัน {balance.toLocaleString()} / {prize.costXp.toLocaleString()}</span>
                {short > 0 && <span className="text-slate-700">อีก {short.toLocaleString()} XP</span>}
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-white/70 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={prize.costXp} aria-valuenow={Math.min(balance, prize.costXp)} aria-label="XP สะสมสำหรับสิทธิ์ลุ้น">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
              </div>
            </div>
            )}
            {entered ? (
              <Link href="/rewards?tab=my_vouchers" className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-white hover:bg-amber-50 text-sm font-bold shrink-0">
                ดูรหัสสิทธิ์ของฉัน
              </Link>
            ) : short === 0 ? (
              <Link href={`/rewards?reward=${prize.id}`} className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shrink-0">
                แลกสิทธิ์ลุ้นเลย
              </Link>
            ) : (
              <Link href={`/rewards?reward=${prize.id}`} className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-white/80 hover:bg-white text-sm font-bold shrink-0">
                ดูกติกาลุ้นรางวัล
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="flex-1 text-sm font-medium text-slate-800">{drawLabel ? `ประกาศผล ${drawLabel} ` : ''}สมัครฟรีแล้ว XP จะเริ่มนับทันที</p>
            <button type="button" onClick={onSignUp} className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shrink-0 cursor-pointer">
              สมัครแล้วเริ่มสะสม
            </button>
          </>
        )}
      </div>
    </section>
  );
}
