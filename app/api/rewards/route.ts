import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { RewardError, redeemReward, rewardsOf } from '@/lib/social/rewardsLedger';

const EMPTY = { points: { total: 0, fromVisits: 0, fromQuests: 0, earned: 0, spent: 0, balance: 0 }, quests: [], redeemedRewardIds: [], redemptions: [] };
const headers = { 'Cache-Control': 'private, no-store' };

// The signed-in member's points (earned, spent, balance), challenge progress and redeemed rewards
export async function GET(request: Request) {
  try {
    const member = await getSessionMember(request);
    if (!member) return NextResponse.json({ success: true, requiresLogin: true, ...EMPTY }, { headers });
    return NextResponse.json({ success: true, ...(await rewardsOf(member.id)) }, { headers });
  } catch (error) {
    console.error('Error in /api/rewards GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดแต้มไม่สำเร็จ' }, { status: 500 });
  }
}

// { rewardId } → redeems a reward from the catalog (data/rewardsData.ts) with the member's balance
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้' }, { status: 403 });
  if (isRateLimited(`reward-redeem:${member.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const rewardId = typeof body.rewardId === 'string' ? body.rewardId : '';
    return NextResponse.json({ success: true, ...(await redeemReward(member.id, rewardId)) }, { headers });
  } catch (error) {
    if (error instanceof RewardError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/rewards POST:', error);
    return NextResponse.json({ success: false, message: 'แลกของรางวัลไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}
