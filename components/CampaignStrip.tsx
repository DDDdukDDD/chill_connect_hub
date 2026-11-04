'use client';

import { useId, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Gift } from 'lucide-react';
import { useDragRail } from '@/components/campaigns/useDragRail';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { type Campaign, campaignDay } from '@/lib/campaigns/types';
import { optimizedImage } from '@/lib/optimizedImage';

/** Where a member stands in the campaign (owner 2026-10-25, 2026-11-04) */
export interface CampaignMemberState {
  xp: number;
  /** Signed up from the popup, or redeemed the prize */
  enrolled: boolean;
  /** Redeemed the campaign's prize entry */
  entered: boolean;
  /** Steps done and XP enough: the entry can be redeemed */
  ready: boolean;
  done: number;
  total: number;
}

interface CampaignStripProps {
  campaign: Campaign;
  member?: CampaignMemberState | null;
  onOpen: (id: string) => void;
  className?: string;
  /** A plain row inside the folded line beside the member feed */
  narrow?: boolean;
}

/**
 * One campaign as one soft card of a fixed height, whatever its state, the same look as on PromoBoard (owner 2026-11-04):
 * where the member stands, the headline, and the prize as a tilted sticker. Pressing it opens the popup (components/campaigns/useCampaigns.tsx).
 */
export function CampaignStrip({ campaign, member, onOpen, className = '', narrow = false }: CampaignStripProps) {
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign.rewardId);
  const cost = prize?.costXp ?? 0;
  const xp = member?.xp ?? 0;
  const image = optimizedImage(campaign.prizeImage, 256);
  const enrolled = Boolean(member?.enrolled);
  const ready = enrolled && Boolean(member?.ready);
  const collecting = enrolled && !member?.entered && !ready && Boolean(prize);
  const until = `ถึง ${campaignDay(campaign.endDate)}`;
  const picture = image ? (
    // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
    <img src={image} alt="" draggable={false} className="w-full h-full object-contain" />
  ) : (
    <Gift className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
  );

  if (narrow) {
    const line = member?.entered
      ? `คุณมีสิทธิ์ลุ้นแล้ว${prize?.drawEntry ? ` · ประกาศผล ${prize.drawEntry.drawLabel}` : ''}`
      : ready
        ? 'XP ครบแล้ว แลกสิทธิ์ลุ้นได้เลย'
        : collecting
          ? `เข้าร่วมแล้ว · ทำแล้ว ${member?.done ?? 0}/${member?.total ?? 0}`
          : enrolled
            ? 'เข้าร่วมแล้ว'
            : `${campaign.stripText ? `${campaign.stripText} · ` : ''}${until}`;
    return (
      <button type="button" onClick={() => onOpen(campaign.id)} className={`group w-full text-left flex items-center gap-3 rounded-xl hover:bg-amber-50 text-slate-900 p-1.5 transition-colors cursor-pointer ${className}`}>
        <span className="w-14 h-11 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden p-0.5">{picture}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] line-clamp-2 font-bold leading-snug group-hover:underline">{campaign.headline}</span>
          <span className="mt-0.5 block text-xs text-slate-500 tabular-nums truncate">{line}</span>
        </span>
        <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    );
  }

  const state = member?.entered ? 'คุณมีสิทธิ์ลุ้นแล้ว' : ready ? `XP ของคุณ ${xp.toLocaleString()} ครบแล้ว!` : enrolled ? 'เข้าร่วมแล้ว' : until;
  const detail = member?.entered
    ? (prize?.drawEntry ? `ประกาศผล ${prize.drawEntry.drawLabel}` : until)
    : collecting
      ? `ทำแล้ว ${member?.done ?? 0}/${member?.total ?? 0} ชาเลนจ์ · ${xp.toLocaleString()} / ${cost.toLocaleString()} XP`
      : enrolled && !ready
        ? until
        : '';

  return (
    <button
      type="button"
      onClick={() => onOpen(campaign.id)}
      className={`group w-full h-[108px] sm:h-[120px] lg:h-[128px] text-left flex items-center gap-3 rounded-3xl bg-[#FFF0B3] hover:bg-[#FFE99A] text-slate-900 pl-4 pr-3 sm:pl-5 sm:pr-4 overflow-hidden transition-colors cursor-pointer ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] sm:text-xs font-medium text-slate-600 tabular-nums truncate">{state}{detail && ` · ${detail}`}</span>
        <span className="block text-sm sm:text-base lg:text-lg font-bold leading-snug line-clamp-2 lg:truncate">{campaign.headline}</span>
        <span className="mt-0.5 sm:mt-1 inline-flex items-center gap-1 text-xs sm:text-sm font-bold">
          {ready ? 'แลกสิทธิ์ลุ้น' : enrolled ? 'ดูรายละเอียด' : campaign.cta}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
      <span className="w-[84px] h-[60px] sm:w-[112px] sm:h-[80px] shrink-0 rotate-[5deg] rounded-xl bg-white p-1 shadow-[0_6px_16px_rgba(15,23,42,0.12)] flex items-center justify-center transition-transform duration-200 group-hover:rotate-[-3deg] group-hover:scale-105">
        {picture}
      </span>
    </button>
  );
}

interface CampaignShelfProps {
  campaigns: Campaign[];
  /** Null for a visitor */
  memberOf?: (campaign: Campaign) => CampaignMemberState | null;
  onOpen: (id: string) => void;
  layout?: 'strip' | 'side';
  className?: string;
}

/**
 * The running campaigns (up to ten at once, owner 2026-11-04). A member's come first: enough XP, then what they joined,
 * then the rest. The page shows one card with the edge of the next beside it, which says there is more without a count
 * or arrows: phones swipe, a mouse drags or presses that edge. Beside the feed, one folded line like its neighbours
 * there, closed at first (owner 2026-11-04: the column was too full), that opens to a list.
 */
export function CampaignShelf({ campaigns, memberOf, onOpen, layout = 'strip', className = '' }: CampaignShelfProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const { railRef, handlers } = useDragRail(campaigns.length);
  const rankOf = (campaign: Campaign) => {
    const member = memberOf?.(campaign);
    if (!member?.enrolled) return 3;
    if (member.entered) return 2;
    return member.ready ? 0 : 1;
  };
  const ordered = [...campaigns].sort((a, b) => rankOf(a) - rankOf(b));
  if (ordered.length === 0) return null;

  if (layout === 'side') {
    // The one line says what matters to this member, so a closed line still calls when there is something to do
    const members = ordered.map((campaign) => memberOf?.(campaign));
    const canRedeem = members.filter((member) => member?.enrolled && member.ready && !member.entered).length;
    const joined = members.filter((member) => member?.enrolled).length;
    const hook = canRedeem > 0 ? `แลกสิทธิ์ลุ้นได้แล้ว ${canRedeem} แคมเปญ` : joined > 0 ? `เข้าร่วมแล้ว ${joined} จาก ${ordered.length} แคมเปญ` : 'ออกไปใช้ชีวิต แล้วลุ้นรางวัล';
    return (
      <section aria-label="แคมเปญ" className={className}>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-controls={listId}
          className="w-full flex items-center gap-4 rounded-2xl bg-[#FFF0B3] hover:bg-[#FFE99A] p-3 text-left cursor-pointer transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <span className="relative flex -space-x-3 shrink-0" aria-hidden="true">
            {ordered.slice(0, 3).map((campaign) => (
              <span key={campaign.id} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white bg-white flex items-center justify-center p-0.5">
                {campaign.prizeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
                  <img src={optimizedImage(campaign.prizeImage, 96)} alt="" loading="lazy" className="w-full h-full object-contain" />
                ) : (
                  <Gift className="w-5 h-5 text-[#D97706]" />
                )}
              </span>
            ))}
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full border-2 border-white bg-[#F26430] text-[11px] font-bold text-white flex items-center justify-center tabular-nums">
              {ordered.length}
            </span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-slate-900 truncate">
              แคมเปญ
              <span className="sr-only"> {ordered.length} รายการ</span>
            </span>
            <span className="block text-xs font-semibold text-slate-800 truncate tabular-nums">{hook}</span>
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-800 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {isOpen && (
          <div id={listId} className="mt-2 space-y-1">
            {ordered.map((campaign) => (
              <CampaignStrip key={campaign.id} campaign={campaign} member={memberOf?.(campaign)} onOpen={onOpen} narrow />
            ))}
          </div>
        )}
      </section>
    );
  }

  if (ordered.length === 1) return <CampaignStrip campaign={ordered[0]} member={memberOf?.(ordered[0])} onOpen={onOpen} className={className} />;

  return (
    <section aria-label="แคมเปญที่เปิดอยู่" className={className}>
      <div
        ref={railRef}
        {...handlers}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory select-none"
      >
        {ordered.map((campaign) => (
          <div key={campaign.id} className="w-[calc(100%-2.25rem)] sm:w-[calc(100%-4rem)] shrink-0 snap-start last:snap-end">
            <CampaignStrip campaign={campaign} member={memberOf?.(campaign)} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}
