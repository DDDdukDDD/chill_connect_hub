import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { tidyDisplayName } from '@/lib/displayName';
import { memberRepository } from '@/lib/members';
import { RewardCatalogError, listRewards, saveReward } from '@/lib/rewards/catalog';
import { redemptionStore } from '@/lib/social/stores';

const RECENT_LIMIT = 100;

// The rewards catalog (staff edit it here, lib/rewards/catalog.ts) with what members redeemed from it.
// Member names are member data, so reading needs members.manage like the prize draw.
export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;

  const catalog = await listRewards();
  const perReward = await Promise.all(catalog.map(async (item) => ({ item, redemptions: await redemptionStore.ofReward(item.id) })));
  const all = perReward.flatMap(({ redemptions }) => redemptions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = all.slice(0, RECENT_LIMIT);
  const names = await memberRepository.findByIds([...new Set(recent.map((r) => r.memberId))]);

  return NextResponse.json(
    {
      success: true,
      rewards: perReward.map(({ item, redemptions }) => ({
        item,
        redeemed: redemptions.length,
        members: new Set(redemptions.map((r) => r.memberId)).size,
        xpSpent: redemptions.reduce((sum, r) => sum + r.cost, 0),
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
        };
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// { action: 'save', reward } (new when reward.id is empty): what members see in the shop and the campaign popup
export async function POST(request: Request) {
  const denied = await requireAdminApiAccess(request, 'content.edit');
  if (denied) return denied;
  const actor = await getAdminActor(request);
  try {
    const body = await request.json();
    if (body?.action !== 'save' || !body.reward || typeof body.reward !== 'object') {
      return NextResponse.json({ success: false, error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
    }
    const isNew = !(typeof body.reward.id === 'string' && (await listRewards()).some((item) => item.id === body.reward.id));
    const reward = await saveReward(body.reward);
    recordAudit(actor, isNew ? 'reward.create' : 'reward.update', `${isNew ? 'เพิ่ม' : 'แก้ไข'}ของรางวัล ${reward.title}`, { type: 'reward', id: reward.id });
    return NextResponse.json({ success: true, reward });
  } catch (error) {
    if (error instanceof RewardCatalogError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('Error in /api/admin/rewards POST:', error);
    return NextResponse.json({ success: false, error: 'บันทึกของรางวัลไม่สำเร็จ' }, { status: 500 });
  }
}
