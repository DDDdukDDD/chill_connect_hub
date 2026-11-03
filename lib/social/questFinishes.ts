import { db } from '../db';
import { questMemberStore } from './stores';
import { notifyChallengeFinished } from './notifications';
import type { QuestProgress } from './questProgress';
import { issueVoucher, voucherOf } from './questVouchers';

/**
 * The record that a member finished a challenge (lib/social/stores.ts). Progress is counted
 * from visits on every read, so "finished" has no moment of its own; this store gives it one. The first time
 * a finished challenge is seen, the member is told, the partner's reward code is issued, and the badge is theirs.
 * A badge stays even if the member later leaves the challenge.
 */
export interface QuestFinish {
  memberId: string;
  questId: string;
  finishedAt: string;
}

/** Records every challenge the member has now finished (joined and fully counted) that was not recorded before */
export async function settleFinishes(memberId: string, progress: QuestProgress[]): Promise<void> {
  const done = progress.filter((quest) => quest.completed && quest.joined);
  if (done.length === 0) return;
  const fresh = await questMemberStore.recordFinishes(memberId, done.map((quest) => quest.questId));
  for (const questId of fresh) {
    const quest = await db.findQuestById(questId);
    if (!quest) continue;
    await issueVoucher(memberId, quest);
    await notifyChallengeFinished(memberId, quest.id, quest.title);
  }
}

/** Every finish, for the home page's live activity */
export const allQuestFinishes = (): Promise<QuestFinish[]> => questMemberStore.finishes();

/** When the member finished one challenge; undefined while they have not */
export const finishedAtOf = async (memberId: string, questId: string): Promise<string | undefined> =>
  (await questMemberStore.finishes({ memberId, questId }))[0]?.finishedAt;

/** Badges and reward codes of the challenges a member finished, newest first */
export async function finishesOf(memberId: string) {
  const mine = await questMemberStore.finishes({ memberId });
  const result = [];
  for (const finish of mine) {
    const quest = await db.findQuestById(finish.questId);
    if (!quest) continue;
    const voucher = await voucherOf(memberId, quest.id);
    result.push({
      questId: quest.id,
      title: quest.title,
      badgeLabel: quest.badgeLabel,
      finishedAt: finish.finishedAt,
      voucherCode: voucher?.code ?? null,
      voucherUsedAt: voucher?.usedAt ?? null,
      rewardTitle: quest.brandReward?.type === 'brand_partner' ? quest.brandReward.title : null,
    });
  }
  return result;
}

/** Account deletion */
export async function removeFinishesBy(memberId: string): Promise<void> {
  // The finish is the same row as the join: removeQuestJoinsBy takes it in the database
  await questMemberStore.removeBy(memberId);
}
