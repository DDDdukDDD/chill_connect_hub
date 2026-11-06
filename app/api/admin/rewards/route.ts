import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { tidyDisplayName } from '@/lib/displayName';
import { memberRepository } from '@/lib/members';
import { entryCodeOf } from '@/lib/social/rewardsLedger';
import { redemptionStore } from '@/lib/social/stores';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';

const RECENT_LIMIT = 100;

// The rewards catalog (data/rewardsData.ts, read-only here) with what members redeemed from it.
// Member names are member data, so this needs members.manage like the prize draw.
export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;

  const perReward = await Promise.all(REWARD_SHOP_ITEMS.map(async (item) => ({ item, redemptions: await redemptionStore.ofReward(item.id) })));
  const all = perReward.flatMap(({ redemptions }) => redemptions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = all.slice(0, RECENT_LIMIT);
  const names = await memberRepository.findByIds([...new Set(recent.map((r) => r.memberId))]);

  return NextResponse.json(
    {
      success: true,
      rewards: perReward.map(({ item, redemptions }) => ({
        id: item.id,
        title: item.title,
        partner: item.partner,
        costXp: item.costXp,
        stockCount: item.stockCount,
        redeemed: redemptions.length,
        xpSpent: redemptions.reduce((sum, r) => sum + r.cost, 0),
        drawDate: item.drawEntry?.drawDate ?? null,
      })),
      totals: { redemptions: all.length, xpSpent: all.reduce((sum, r) => sum + r.cost, 0), members: new Set(all.map((r) => r.memberId)).size },
      recent: recent.map((r) => {
        const member = names.get(r.memberId);
        return {
          id: r.id,
          rewardId: r.rewardId,
          memberId: r.memberId,
          memberName: member ? tidyDisplayName(member.displayName).trim() || member.displayName : 'บัญชีที่ลบแล้ว',
          cost: r.cost,
          createdAt: r.createdAt,
          code: entryCodeOf(r.id, r.rewardId),
        };
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
