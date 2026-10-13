import { db } from '../db';
import { createJsonStore } from './jsonStore';
import { notifyChallengeFinished } from './notifications';
import type { QuestProgress } from './questProgress';
import { issueVoucher, voucherOf } from './questVouchers';

/**
 * The record that a member finished a challenge (data/quest_finishes.json, gitignored). Progress is counted
 * from visits on every read, so "finished" has no moment of its own; this store gives it one. The first time
 * a finished challenge is seen, the member is told, the partner's reward code is issued, and the badge is theirs.
 * A badge stays even if the member later leaves the challenge.
 */
export interface QuestFinish {
  memberId: string;
  questId: string;
  finishedAt: string;
}

const store = createJsonStore<QuestFinish>('quest_finishes');

/** Records every challenge the member has now finished (joined and fully counted) that was not recorded before */
export async function settleFinishes(memberId: string, progress: QuestProgress[]): Promise<void> {
  const done = progress.filter((quest) => quest.completed && quest.joined);
  if (done.length === 0) return;
  const known = new Set(store.read().filter((finish) => finish.memberId === memberId).map((finish) => finish.questId));
  const fresh = done.filter((quest) => !known.has(quest.questId));
  if (fresh.length === 0) return;

  const finishedAt = new Date().toISOString();
  await store.update((items) => [
    ...fresh.filter((quest) => !items.some((finish) => finish.memberId === memberId && finish.questId === quest.questId)).map((quest) => ({ memberId, questId: quest.questId, finishedAt })),
    ...items,
  ]);
  for (const entry of fresh) {
    const quest = await db.findQuestById(entry.questId);
    if (!quest) continue;
    await issueVoucher(memberId, quest);
    await notifyChallengeFinished(memberId, quest.id, quest.title);
  }
}

/** When the member finished one challenge; undefined while they have not */
export const finishedAtOf = (memberId: string, questId: string): string | undefined =>
  store.read().find((finish) => finish.memberId === memberId && finish.questId === questId)?.finishedAt;

/** Badges and reward codes of the challenges a member finished, newest first */
export async function finishesOf(memberId: string) {
  const mine = store.read().filter((finish) => finish.memberId === memberId);
  const result = [];
  for (const finish of mine) {
    const quest = await db.findQuestById(finish.questId);
    if (!quest) continue;
    const voucher = voucherOf(memberId, quest.id);
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
  await store.update((items) => items.filter((finish) => finish.memberId !== memberId));
}
