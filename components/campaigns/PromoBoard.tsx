'use client';

import Link from 'next/link';
import { ArrowRight, Check, Gift } from 'lucide-react';
import { useDragRail } from '@/components/campaigns/useDragRail';
import { REWARD_SHOP_ITEMS, type RewardShopItem } from '@/data/rewardsData';
import { type Campaign, campaignDay } from '@/lib/campaigns/types';
import { optimizedImage } from '@/lib/optimizedImage';

const REWARDS_SHOWN = 8;
/** Every card on the board is this tall, so the row has one top and one bottom edge (owner 2026-11-04) */
const CARD_HEIGHT = 'h-[108px] sm:h-[120px] lg:h-[128px]';
/** Flat colours taking turns along the row */
const TINTS = ['bg-[#FFE9DC]', 'bg-[#E4F0FB]', 'bg-[#E3F4E8]', 'bg-[#F0EBFF]'];
/** A little joke per kind of reward, in the voice of a friend */
const QUIPS: Record<RewardShopItem['category'], string> = {
  cafe: 'ออกจากบ้านแล้วได้กาแฟ คุ้มอยู่',
  boardgame: 'แพ้เกมได้ แต่ได้เพื่อนนะ',
  sports: 'วิ่งแล้วได้ของ ไม่ใช่แค่เหงื่อ',
  workshop: 'ปั้นเบี้ยวก็ภูมิใจ',
  merch: 'เอาไว้อวดเพื่อนโดยเฉพาะ',
};

/** One campaign: words on the left, the prize as a tilted sticker. Pressing it opens the popup (components/campaigns/useCampaigns.tsx) */
function CampaignPanel({ campaign, onOpen }: { campaign: Campaign; onOpen: (id: string) => void }) {
  const image = optimizedImage(campaign.prizeImage, 640);
  return (
    <button type="button" onClick={() => onOpen(campaign.id)} className={`group relative w-full ${CARD_HEIGHT} text-left flex items-center gap-3 rounded-3xl bg-[#FFF0B3] hover:bg-[#FFE99A] text-slate-900 pl-4 pr-3 sm:pl-5 sm:pr-4 overflow-hidden transition-colors cursor-pointer`}>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] sm:text-xs font-medium text-slate-600 tabular-nums">ถึง {campaignDay(campaign.endDate)}</span>
        <span className="block text-sm sm:text-base lg:text-lg font-bold leading-snug line-clamp-2">{campaign.headline}</span>
        <span className="mt-0.5 sm:mt-1 inline-flex items-center gap-1 text-xs sm:text-sm font-bold">
          {campaign.cta}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
      <span className="w-[84px] h-[60px] sm:w-[112px] sm:h-[80px] shrink-0 rotate-[5deg] rounded-xl bg-white p-1 shadow-[0_6px_16px_rgba(15,23,42,0.12)] flex items-center justify-center transition-transform duration-200 group-hover:rotate-[-3deg] group-hover:scale-105">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
          <img src={image} alt="" draggable={false} className="w-full h-full object-contain" />
        ) : (
          <Gift className="w-8 h-8 text-slate-500" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}

/** A reward as a flat card: price, name and a joke, with its photo as a round sticker in the corner. A member with enough XP is told so */
function RewardCard({ item, tint, canRedeem }: { item: RewardShopItem; tint: string; canRedeem: boolean }) {
  return (
    <Link href={`/rewards?reward=${encodeURIComponent(item.id)}`} draggable={false} className={`group relative block ${CARD_HEIGHT} rounded-3xl ${tint} px-3.5 py-2.5 overflow-hidden`}>
      <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900 tabular-nums">{item.costXp.toLocaleString()} XP</span>
      {canRedeem && (
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          <Check className="w-3 h-3" aria-hidden="true" />
          แลกได้แล้ว
        </span>
      )}
      <span className="mt-1 block pr-3 text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{item.title}</span>
      <span className="absolute left-3.5 right-14 bottom-2.5 text-[11px] text-slate-600 truncate">{QUIPS[item.category]}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link */}
      <img src={optimizedImage(item.image, 128)} alt="" loading="lazy" draggable={false} className="absolute -right-2 -bottom-2 w-14 h-14 rounded-full border-[3px] border-white object-cover rotate-6 bg-white transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-105" />
    </Link>
  );
}

/**
 * What going out can earn (owner 2026-11-04, the layout after Trip.com: minimal and a bit funny): the running campaigns
 * on the left half, rewards to redeem as a row to swipe on the right. Every card has one height and the row has no
 * headings, so its edges line up. With no campaign to show, the rewards take the whole width. The landing leaves the
 * rewards out (`withRewards={false}`, owner 2026-11-04): a visitor has no XP yet, and /challenges is where it is earned.
 */
export function PromoBoard({ campaigns, onOpen, redeemedRewardIds = [], withRewards = true, balance, rewardsOnPhone = false, className = '' }: {
  campaigns: Campaign[];
  onOpen?: (id: string) => void;
  redeemedRewardIds?: string[];
  withRewards?: boolean;
  /** A signed-in member's XP: what it covers says so and comes first */
  balance?: number;
  /** On /challenges the list comes first on phones; where the rewards are the point, they stay */
  rewardsOnPhone?: boolean;
  className?: string;
}) {
  const canRedeem = (item: RewardShopItem) => balance !== undefined && balance >= item.costXp;
  const rewards = withRewards
    ? REWARD_SHOP_ITEMS.filter((item) => !item.campaignOnly && !item.drawEntry && !redeemedRewardIds.includes(item.id))
        .sort((a, b) => Number(canRedeem(b)) - Number(canRedeem(a)) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
        .slice(0, REWARDS_SHOWN)
    : [];
  const hasCampaigns = campaigns.length > 0;
  // Alone, campaigns show two at a time, so a press on either opens it
  const { railRef: campaignRailRef, handlers: campaignHandlers, page: campaignPage, goTo: goToCampaign } = useDragRail(campaigns.length, { pressBringsIn: withRewards });
  // One more card at the end of the row: all the rewards
  const { railRef: rewardRailRef, handlers: rewardHandlers } = useDragRail(rewards.length + 1, { pressBringsIn: false });
  if (!hasCampaigns && rewards.length === 0) return null;
  const railClass = 'flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory select-none';
  // Two and the next one's edge beside a campaign; four and an edge on their own
  const rewardWidth = hasCampaigns ? 'w-[62%] sm:w-[calc((100%-3.25rem)/2)]' : 'w-[62%] sm:w-[calc((100%-3.25rem)/2)] lg:w-[calc((100%-4.5rem)/4)]';

  const campaignWidth = campaigns.length === 1 ? 'w-full' : withRewards ? 'w-[calc(100%-2.25rem)] lg:w-full' : 'w-[calc(100%-2.25rem)] sm:w-[calc((100%-3.25rem)/2)]';

  return (
    <section aria-label={withRewards ? 'แคมเปญและของรางวัล' : 'แคมเปญที่เปิดอยู่'} className={`grid gap-3 ${hasCampaigns && withRewards ? 'lg:grid-cols-2' : ''} ${className}`}>
      {hasCampaigns && (
        <div className="relative min-w-0">
          <div ref={campaignRailRef} {...campaignHandlers} className={railClass}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className={`${campaignWidth} shrink-0 snap-start last:snap-end`}>
                <CampaignPanel campaign={campaign} onOpen={onOpen ?? (() => {})} />
              </div>
            ))}
          </div>
          {/* Laptops show one campaign beside the rewards, so small dots say there are more; elsewhere the next one's edge says it */}
          {withRewards && campaigns.length > 1 && (
            <div className="hidden lg:flex absolute bottom-0.5 left-1/2 -translate-x-1/2">
              {campaigns.map((campaign, index) => (
                <button key={campaign.id} type="button" onClick={() => goToCampaign(index)} aria-label={`แคมเปญที่ ${index + 1}`} aria-current={index === campaignPage} className="group/dot p-1.5 cursor-pointer">
                  <span className={`block w-1.5 h-1.5 rounded-full transition-colors ${index === campaignPage ? 'bg-slate-900' : 'bg-slate-900/25 group-hover/dot:bg-slate-900/50'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {rewards.length > 0 && (
        <div ref={rewardRailRef} {...rewardHandlers} aria-label="ของรางวัลแลกด้วย XP" className={`${railClass} ${rewardsOnPhone || !hasCampaigns ? '' : 'max-sm:hidden'} min-w-0`}>
          {rewards.map((item, index) => (
            <div key={item.id} className={`${rewardWidth} shrink-0 snap-start`}>
              <RewardCard item={item} tint={TINTS[index % TINTS.length]} canRedeem={canRedeem(item)} />
            </div>
          ))}
          <div className={`${rewardWidth} shrink-0 snap-start last:snap-end`}>
            <Link href="/rewards" draggable={false} className={`group flex flex-col justify-center ${CARD_HEIGHT} rounded-3xl bg-slate-100 px-3.5`}>
              <span className="text-xs text-slate-600 leading-snug">ยังมีอีกเยอะ เลือกให้ปวดหัวเล่น</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
                ดูของรางวัลทั้งหมด
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
