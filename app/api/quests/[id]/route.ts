import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { joinCounts, joinedQuestIdsOf } from '@/lib/social/questJoins';
import { settleFinishes } from '@/lib/social/questFinishes';
import { minEvidenceOf, progressOf, targetsOfQuest } from '@/lib/social/questProgress';
import { voucherOf } from '@/lib/social/questVouchers';

/**
 * One challenge for its detail view: where to go for it, and for the signed-in member whether they joined,
 * their counted progress, and their reward code once a partner challenge is finished.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const quest = await db.findQuestById(decodeURIComponent(id));
    if (!quest || quest.status === 'draft') return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์นี้' }, { status: 404 });

    const member = await getSessionMember(request);
    const where = await targetsOfQuest(quest, member?.id ?? null);
    let mine = null;
    if (member) {
      const joined = joinedQuestIdsOf(member.id).includes(quest.id);
      const all = (await progressOf(member.id)).quests;
      await settleFinishes(member.id, all);
      const progress = all.find((entry) => entry.questId === quest.id);
      // The reward is the member's only when they joined and the server counted every visit
      const earned = Boolean(joined && progress?.completed);
      const voucher = earned ? voucherOf(member.id, quest.id) : null;
      mine = {
        joined,
        current: progress?.current ?? 0,
        total: progress?.total ?? null,
        completed: earned,
        voucherCode: voucher?.code ?? null,
        voucherUsedAt: voucher?.usedAt ?? null,
      };
    }

    return NextResponse.json(
      {
        success: true,
        quest: { ...quest, participantsCount: (quest.participantsCount ?? 0) + (joinCounts().get(quest.id) ?? 0) },
        /** False when the server cannot count this challenge: the member only notes progress for themselves */
        tracked: Boolean(quest.rule),
        minEvidence: quest.rule ? minEvidenceOf(quest) : null,
        targets: where?.targets ?? [],
        targetsTotal: where?.total ?? 0,
        browseHref: where?.browseHref ?? null,
        mine,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Error in /api/quests/[id] GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดชาเลนจ์ไม่สำเร็จ' }, { status: 500 });
  }
}
