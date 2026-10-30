import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { type Campaign, campaignDay } from '@/lib/campaigns/types';

/** Drawn stand-in for the prize photo: a phone seen from the back, two lenses, a few sparkles */
function PrizePhoneArt() {
  return (
    <svg viewBox="0 0 120 150" className="w-full h-full drop-shadow-xl" aria-hidden="true">
      <defs>
        <linearGradient id="campaign-phone-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB38A" />
          <stop offset="0.55" stopColor="#F26430" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      <g transform="rotate(-10 60 80)">
        <rect x="28" y="18" width="64" height="124" rx="14" fill="url(#campaign-phone-body)" stroke="#FFFFFF" strokeWidth="3" />
        <rect x="35" y="26" width="26" height="40" rx="9" fill="#FFFFFF" fillOpacity="0.28" />
        <circle cx="48" cy="37" r="7" fill="#1E293B" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" />
        <circle cx="48" cy="55" r="7" fill="#1E293B" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" />
        <circle cx="45.5" cy="34.5" r="1.8" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="45.5" cy="52.5" r="1.8" fill="#FFFFFF" fillOpacity="0.7" />
        <path d="M60 96c-5-6-14-3-14 4 0 7 14 14 14 14s14-7 14-14c0-7-9-10-14-4z" fill="#FFFFFF" fillOpacity="0.85" />
      </g>
      <path d="M104 22l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FFFFFF" />
      <path d="M14 96l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFFFFF" />
      <circle cx="102" cy="120" r="3" fill="#FFFFFF" />
    </svg>
  );
}

/** Where a member stands in the campaign; decides how loud the strip is (owner 2026-10-25) */
export interface CampaignMemberState {
  xp: number;
  /** Joined at least one of the campaign's challenges */
  started: boolean;
  /** When the member redeemed the campaign's prize entry */
  enteredAt?: string;
  /** The page's clock (ms), so the entry note can end after a few days */
  now: number;
}

const ENTERED_SHOWN_DAYS = 3;

/** Prize picture: a white tile with a slight tilt (the picture has a white background), or the drawn phone */
function PrizeTile({ campaign, size }: { campaign: Campaign; size: 'full' | 'slim' }) {
  if (size === 'slim') {
    return campaign.prizeImage ? (
      <span className="w-12 h-9 sm:w-14 sm:h-10 shrink-0 rotate-[-4deg] rounded-lg bg-white p-0.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={campaign.prizeImage} alt="" className="w-full h-full object-contain" />
      </span>
    ) : (
      <span className="w-9 h-11 shrink-0"><PrizePhoneArt /></span>
    );
  }
  // The prize rises above the strip's top edge
  return campaign.prizeImage ? (
    <span className="absolute left-3 sm:left-5 bottom-3 w-[98px] h-[68px] sm:w-[144px] sm:h-[98px] rotate-[-5deg] rounded-2xl bg-white p-1 shadow-lg transition-transform group-hover:rotate-[-2deg] group-hover:-translate-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={campaign.prizeImage} alt="ของรางวัล" className="w-full h-full object-contain" />
    </span>
  ) : (
    <span className="absolute left-2 sm:left-4 bottom-1 w-[80px] h-[100px] sm:w-[104px] sm:h-[130px] transition-transform group-hover:-rotate-3 group-hover:-translate-y-1">
      <PrizePhoneArt />
    </span>
  );
}

/**
 * The running campaign on the home page (owner 2026-10-25). The server passes the running campaign
 * (liveCampaign({ home: true })), so it goes away outside the dates or when staff turn the strip off.
 *
 * Visitors (no `member`): the full card under the hero; its job is to make them want the prize and sign up.
 * Members (on the member home, beside the feed on laptops and between posts on phones): loud only when there is a decision to make.
 *   ① not started (joined none of its challenges) → full card, "เริ่มสะสมสิทธิ์"
 *   ② collecting → one slim line with the XP bar
 *   ③ enough XP → full card again, "แลกสิทธิ์ลุ้นเลย"
 *   ④ entered → a slim confirmation for 3 days, then nothing
 * The next campaign uses the same slot and states.
 */
export function CampaignStrip({ campaign, member, className = '', layout = 'strip' }: { campaign: Campaign | null; member?: CampaignMemberState; className?: string; layout?: 'strip' | 'side' }) {
  if (!campaign) return null;
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign.rewardId);
  const cost = prize?.costXp ?? 0;
  const tracked = Boolean(member && prize);
  const xp = member?.xp ?? 0;
  const short = Math.max(0, cost - xp);
  const percent = Math.min(100, Math.round((xp / Math.max(1, cost)) * 100));

  if (tracked && member?.enteredAt) {
    if (member.now - Date.parse(member.enteredAt) > ENTERED_SHOWN_DAYS * 24 * 3600 * 1000) return null;
    return (
      <Link href="/rewards?tab=my_vouchers" className={`group flex items-center gap-3 rounded-2xl bg-[#FFF4C7] hover:bg-[#FFEDA8] px-3.5 sm:px-4 py-2.5 transition-colors ${className}`}>
        <PrizeTile campaign={campaign} size="slim" />
        <span className="min-w-0 flex-1 text-sm text-slate-800">
          <span className="font-bold">คุณมีสิทธิ์ลุ้นแล้ว</span>
          {prize?.drawEntry && <span className="text-slate-600"> · ประกาศผล {prize.drawEntry.drawLabel}</span>}
        </span>
        <span className="shrink-0 inline-flex items-center gap-0.5 text-sm font-bold text-slate-900">
          <span className="hidden sm:inline">ดูรหัสสิทธิ์</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </Link>
    );
  }

  if (tracked && member?.started && short > 0) {
    return (
      <Link href="/challenges#launch-campaign" className={`group flex items-center gap-3 rounded-2xl bg-[#FFF4C7] hover:bg-[#FFEDA8] px-3.5 sm:px-4 py-2.5 transition-colors ${className}`}>
        <PrizeTile campaign={campaign} size="slim" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs sm:text-sm tabular-nums">
            <span className="min-w-0 max-w-full truncate font-bold text-slate-900">{campaign.name}</span>
            <span className="shrink-0 font-semibold text-slate-700">{xp.toLocaleString()} / {cost.toLocaleString()} XP · อีก {short.toLocaleString()}</span>
          </span>
          <span className="mt-1 block h-1.5 rounded-full bg-white overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
          </span>
        </span>
        <span className="shrink-0 inline-flex items-center gap-0.5 text-sm font-bold text-slate-900">
          <span className="hidden sm:inline">ดูวิธีสะสม</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </Link>
    );
  }

  // Full card: visitors, members who have not started, and members with enough XP to enter
  const ready = tracked && short === 0;
  const href = ready ? `/rewards?reward=${prize?.id}` : '/challenges#launch-campaign';
  // Beside the member feed (owner 2026-10-30): the same card stacked, prize on top, for a 300px column
  if (layout === 'side') {
    return (
      <Link href={href} className={`group block rounded-3xl bg-[#FFD84D] hover:bg-[#FFCF26] text-slate-900 p-4 transition-colors ${className}`}>
        <span className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C]">
            {ready ? `XP ของคุณ ${xp.toLocaleString()} ครบแล้ว!` : `ถึง ${campaignDay(campaign.endDate)}`}
          </span>
          <PrizeTile campaign={campaign} size="slim" />
        </span>
        <span className="mt-2 block text-base font-bold leading-snug">{ready ? 'สะสมครบแล้ว แลกสิทธิ์ลุ้นได้เลย' : campaign.headline}</span>
        <span className="mt-0.5 block text-xs text-slate-800">
          {ready ? `${prize?.title ?? ''}${prize?.drawEntry ? ` · ประกาศผล ${prize.drawEntry.drawLabel}` : ''}` : campaign.stripText}
        </span>
        <span className="mt-3 flex items-center justify-center gap-1 h-10 rounded-full bg-[#F26430] group-hover:bg-[#E2551F] text-white text-sm font-semibold transition-colors">
          {ready ? 'แลกสิทธิ์ลุ้นเลย' : campaign.cta}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 sm:gap-5 rounded-3xl bg-[#FFD84D] hover:bg-[#FFCF26] text-slate-900 pl-[118px] sm:pl-[178px] pr-4 sm:pr-5 py-3 sm:py-3.5 mt-5 sm:mt-6 transition-colors ${className}`}
    >
      <PrizeTile campaign={campaign} size="full" />
      <span className="min-w-0 flex-1">
        <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-[#C2410C]">
          {ready ? `XP ของคุณ ${xp.toLocaleString()} ครบแล้ว!` : <><span className="hidden sm:inline">{campaign.eyebrow} · </span>ถึง {campaignDay(campaign.endDate)}</>}
        </span>
        <span className="mt-1.5 block text-base sm:text-xl font-bold leading-snug">{ready ? 'สะสมครบแล้ว แลกสิทธิ์ลุ้นได้เลย' : campaign.headline}</span>
        <span className="mt-0.5 block text-xs sm:text-sm text-slate-800">
          {ready ? `${prize?.title ?? ''}${prize?.drawEntry ? ` · ประกาศผล ${prize.drawEntry.drawLabel}` : ''}` : campaign.stripText}
        </span>
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 shrink-0 h-11 px-5 rounded-full bg-[#F26430] group-hover:bg-[#E2551F] text-white text-sm font-semibold shadow-[0_8px_20px_rgba(242,100,48,0.28)] transition-colors">
        {ready ? 'แลกสิทธิ์ลุ้นเลย' : campaign.cta}
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
      <ChevronRight className="sm:hidden w-5 h-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
