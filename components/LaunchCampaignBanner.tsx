'use client';

import Link from 'next/link';
import { ChevronRight, Gift } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { type Campaign, campaignDay } from '@/lib/campaigns/types';
import type { QuestProgress } from '@/lib/useMyRewards';

interface LaunchCampaignBannerProps {
  /** The running campaign (lib/campaigns/store.ts liveCampaign, read on the server); null hides the banner */
  campaign: Campaign | null;
  /** The challenge catalog; the banner counts the campaign's step challenges from it */
  quests: ChallengeQuest[];
  isLoggedIn: boolean;
  balance: number;
  progress: QuestProgress[];
  redeemedRewardIds: string[];
  onSignUp: () => void;
}

/**
 * The running campaign on /challenges as one thin line (owner 2026-10-27): the home page leads the campaign,
 * this page's job is picking a challenge. What it is, where the member stands, and the one action.
 */
export function LaunchCampaignBanner({ campaign, quests, isLoggedIn, balance, progress, redeemedRewardIds, onSignUp }: LaunchCampaignBannerProps) {
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign?.rewardId);
  const steps = (campaign?.questIds ?? []).flatMap((id) => quests.filter((quest) => quest.id === id));
  if (!campaign || !prize || steps.length === 0) return null;

  const entered = redeemedRewardIds.includes(prize.id);
  const short = Math.max(0, prize.costXp - balance);
  const done = steps.filter((quest) => progress.some((item) => item.questId === quest.id && item.completed && item.joined)).length;

  // Where the member stands, in a few words
  const status = !isLoggedIn
    ? `ครบ ${steps.length} ชาเลนจ์ · ถึง ${campaignDay(campaign.endDate)}`
    : entered
      ? 'คุณมีสิทธิ์ลุ้นแล้ว'
      : short === 0
        ? 'XP พอแลกสิทธิ์แล้ว'
        : `ทำแล้ว ${done}/${steps.length} ชาเลนจ์ · อีก ${short.toLocaleString()} XP`;
  const action = 'inline-flex items-center gap-0.5 min-h-9 pl-3.5 pr-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors';

  return (
    <section
      id="launch-campaign"
      aria-labelledby="launch-campaign-title"
      className="scroll-mt-24 rounded-2xl bg-[#FFD84D] text-slate-900 pl-3 pr-2 py-2 flex items-center gap-3"
    >
      <Gift className="w-5 h-5 shrink-0" aria-hidden="true" />
      {/* Phone: headline over status; wide: one line */}
      <p className="flex-1 min-w-0 sm:flex sm:items-baseline sm:gap-2 leading-snug">
        <span id="launch-campaign-title" className="block sm:inline text-sm font-bold truncate">{campaign.headline}</span>
        <span className="block sm:inline text-xs font-semibold text-slate-700 tabular-nums truncate">{status}</span>
      </p>
      {!isLoggedIn ? (
        <button type="button" onClick={onSignUp} className={`${action} bg-slate-900 hover:bg-slate-800 text-white cursor-pointer`}>
          สมัครเลย<ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : entered ? (
        <Link href="/rewards?tab=my_vouchers" className={`${action} bg-white/80 hover:bg-white`}>
          ดูรหัสสิทธิ์<ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : short === 0 ? (
        <Link href={`/rewards?reward=${prize.id}`} className={`${action} bg-slate-900 hover:bg-slate-800 text-white`}>
          แลกสิทธิ์<ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link href={`/rewards?reward=${prize.id}`} className={`${action} bg-white/80 hover:bg-white`}>
          ดูกติกา<ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
