import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { memberRepository } from '@/lib/members';
import { momentRepository } from '@/lib/moments';
import { campaignMemberStore } from '@/lib/campaigns/members';
import { listCampaigns } from '@/lib/campaigns/store';
import { isCampaignLive } from '@/lib/campaigns/types';
import { pushConfigured } from '@/lib/social/push';
import { pushStore } from '@/lib/social/pushStore';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';

const DAY_MS = 24 * 60 * 60 * 1000;
// Recent moments are read newest first and counted; past this many in a week the count shows as "500+"
const RECENT_MOMENTS = 500;

/** Start of today in Bangkok, as a timestamp */
const bangkokDayStart = () => {
  const now = Date.now() + 7 * 3600 * 1000;
  return now - (now % DAY_MS) - 7 * 3600 * 1000;
};

// Whether the community is alive, for the admin home: totals only, no member's details
export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.view');
  if (denied) return denied;

  const today = bangkokDayStart();
  const weekAgo = Date.now() - 7 * DAY_MS;
  const [{ items: members }, recent, campaigns, push] = await Promise.all([
    memberRepository.query({ status: 'all', page: 1, limit: 100_000 }),
    momentRepository.query({ statuses: ['published'], sort: 'newest', page: 1, limit: RECENT_MOMENTS }),
    listCampaigns(),
    pushStore.summary(),
  ]);
  const since = (at: number) => (item: { createdAt: string }) => Date.parse(item.createdAt) >= at;

  const live = campaigns.filter((c) => isCampaignLive(c));
  const liveCampaigns = await Promise.all(live.map(async (c) => ({
    id: c.id,
    name: c.name,
    endDate: c.endDate,
    enrolled: await campaignMemberStore.countOf(c.id),
    drawDate: REWARD_SHOP_ITEMS.find((item) => item.id === c.rewardId)?.drawEntry?.drawDate ?? null,
  })));

  return NextResponse.json(
    {
      success: true,
      members: { total: members.length, today: members.filter(since(today)).length, week: members.filter(since(weekAgo)).length },
      moments: { today: recent.items.filter(since(today)).length, week: recent.items.filter(since(weekAgo)).length, capped: recent.items.length === RECENT_MOMENTS },
      campaigns: liveCampaigns,
      push: { configured: pushConfigured, ...push },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
