import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { finishesOf } from '@/lib/social/questFinishes';
import { joinsOf } from '@/lib/social/questJoins';
import { bangkokDay, planStatus } from '@/lib/social/questPlan';
import { questStampStore } from '@/lib/social/questStampStore';

// GET → { plans: [{ questId, title, image, status }] }: the signed-in member's challenges done by plan, for My Hub's
// "วันนี้ตามแผน" (lib/social/questPlan.ts). Finished plans, and plans that ended more than a day ago, are left out.
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const joins = await joinsOf(member.id);
  const plans = [];
  if (joins.length) {
    const stamps = await questStampStore.stamps({ memberId: member.id });
    // A finished challenge has nothing left to do today
    const finished = new Set((await finishesOf(member.id)).map((finish) => finish.questId));
    for (const join of joins) {
      const quest = await db.findQuestById(join.questId);
      if (!quest?.plan || quest.rule || finished.has(quest.id)) continue;
      const status = planStatus(quest.plan, bangkokDay(join.joinedAt), stamps.filter((s) => s.questId === quest.id).map((s) => s.day));
      if (status.ended && !status.yesterdayOpen) continue;
      plans.push({ questId: quest.id, title: quest.title, image: quest.image ?? quest.badgeCoverImg ?? null, status });
    }
  }
  return NextResponse.json({ success: true, plans }, { headers: { 'Cache-Control': 'private, no-store' } });
}
