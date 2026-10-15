import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember } from '@/lib/members/session';
import { joinCounts, joinedQuestIdsOf } from '@/lib/social/questJoins';
import { getMasterData } from '@/lib/masterDataStore';
import { finishedAtOf, settleFinishes } from '@/lib/social/questFinishes';
import { memoriesOfQuest, minEvidenceOf, progressOf, targetsOfQuest } from '@/lib/social/questProgress';
import { voucherOf } from '@/lib/social/questVouchers';
import { questDateRange } from '@/lib/questDisplay';

/**
 * One challenge for its detail view: where to go for it, and for the signed-in member whether they joined,
 * their counted progress, and their reward code once a partner challenge is finished. A finished challenge also
 * comes with the places they went for it (`mine.memories`) and one challenge to go on with (`next`).
 * Everyone gets a few more open challenges to look at (`related`), the same category first.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const quest = await db.findQuestById(decodeURIComponent(id));
    if (!quest || quest.status === 'draft') return NextResponse.json({ success: false, message: 'ไม่พบชาเลนจ์นี้' }, { status: 404 });

    const member = await getSessionMember(request);
    // Places in the member's own province come first (the province they gave at sign-up)
    const province = getMasterData().provinces.find((entry) => entry.id === member?.preferences?.province);
    const where = await targetsOfQuest(quest, member?.id ?? null, 6, province ? [province.id, province.displayName] : []);
    let mine = null;
    let next = null;
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
        finishedAt: earned ? finishedAtOf(member.id, quest.id) ?? null : null,
        memories: earned ? await memoriesOfQuest(quest, member.id) : [],
      };

      if (earned) {
        // One challenge to go on with: still running, countable, not done or joined yet; the same topic first
        const { items } = await db.findQuests({ page: 1, limit: 200, status: 'active' });
        const taken = new Set(all.filter((entry) => entry.completed || entry.joined).map((entry) => entry.questId));
        const open = items
          .filter((entry) => entry.rule && entry.id !== quest.id && !taken.has(entry.id))
          .sort((a, b) => Number(b.category === quest.category) - Number(a.category === quest.category) || (b.participantsCount ?? 0) - (a.participantsCount ?? 0));
        if (open[0]) {
          next = { id: open[0].id, title: open[0].title, image: open[0].image ?? open[0].badgeCoverImg ?? null, rewardPoints: open[0].rewardPoints ?? 0, rewardTitle: open[0].brandReward?.title ?? null };
        }
      }
    }

    // A few more challenges to go on to: open, not this one, not already joined; the same category first, then the busiest
    const joins = joinCounts();
    const joinedIds = new Set(member ? joinedQuestIdsOf(member.id) : []);
    const { items: openQuests } = await db.findQuests({ page: 1, limit: 200, status: 'active' });
    const related = openQuests
      .filter((entry) => entry.id !== quest.id && !joinedIds.has(entry.id) && entry.status !== 'ended' && (entry.daysRemaining ?? 1) > 0)
      .map((entry) => ({ entry, people: (entry.participantsCount ?? 0) + (joins.get(entry.id) ?? 0) }))
      .sort((a, b) => Number(b.entry.category === quest.category) - Number(a.entry.category === quest.category) || b.people - a.people)
      .slice(0, 4)
      .map(({ entry, people }) => ({
        id: entry.id,
        title: entry.title,
        image: entry.badgeCoverImg || entry.image || null,
        rewardPoints: entry.rewardPoints ?? 0,
        period: questDateRange(entry),
        startsInDays: entry.startsInDays ?? 0,
        participantsCount: people,
      }));

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
        next,
        related,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Error in /api/quests/[id] GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดชาเลนจ์ไม่สำเร็จ' }, { status: 500 });
  }
}
