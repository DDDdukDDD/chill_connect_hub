import { entryRulesOf } from '@/data/rewardsData';
import { bangkokToday } from '../campaigns/types';
import { entryCodeOf, findReward, listRewards } from '../rewards/catalog';
import { redemptionStore } from './stores';
import { joinedQuestIdsOf } from './questJoins';
import { finishesOf, settleFinishes } from './questFinishes';
import { progressOf } from './questProgress';

/**
 * A member's points: earned from visits and finished challenges (lib/social/questProgress.ts),
 * minus what they spent on rewards. Only the spending is stored; the balance is worked out on each read.
 */
export interface Redemption {
  id: string;
  memberId: string;
  rewardId: string;
  /** Price at the time of redeeming, so a later price change does not rewrite the balance */
  cost: number;
  createdAt: string;
}

export class RewardError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** How many times a reward was redeemed (prize entries, for campaign stats) */
export const redemptionCountOf = (rewardId: string) => redemptionStore.countOf(rewardId);

/** Points, challenge progress and redeemed rewards of one member */
export async function rewardsOf(memberId: string) {
  const progress = await progressOf(memberId);
  // A challenge finished since the last read is recorded now: notification, reward code, badge
  await settleFinishes(memberId, progress.quests);
  const [redemptions, catalog] = await Promise.all([redemptionStore.ofMember(memberId), listRewards()]);
  const rewardOf = (id: string) => catalog.find((item) => item.id === id);
  const spent = redemptions.reduce((sum, r) => sum + r.cost, 0);
  return {
    points: { ...progress.points, earned: progress.points.total, spent, balance: Math.max(0, progress.points.total - spent) },
    quests: progress.quests,
    joinedQuestIds: await joinedQuestIdsOf(memberId),
    /** Challenges the member finished: the badge, and the code when a partner gives the reward */
    finished: await finishesOf(memberId),
    // A draw may be redeemed more than once (BE-391): one id here, every entry below
    redeemedRewardIds: [...new Set(redemptions.map((r) => r.rewardId))],
    redemptions: redemptions.map(({ id, rewardId, cost, createdAt }) => ({ rewardId, cost, createdAt, code: entryCodeOf(id, rewardOf(rewardId)) })),
  };
}

/** When today began in Bangkok: the daily entry limit counts from here */
const bangkokDayStart = () => new Date(`${bangkokToday()}T00:00:00+07:00`).toISOString();

/**
 * A voucher once per member; a draw entry up to the reward's limits (per member, per day), each one paid in full.
 * The balance must cover the price
 */
export async function redeemReward(memberId: string, rewardId: string) {
  const reward = await findReward(rewardId);
  if (!reward || reward.hidden) throw new RewardError('ไม่พบของรางวัลนี้', 404);
  const rules = entryRulesOf(reward);
  const current = await rewardsOf(memberId);
  const held = current.redemptions.filter((r) => r.rewardId === rewardId);
  const fullMessage = rules.max > 1 ? `คุณแลกครบ ${rules.max} สิทธิ์แล้ว` : 'คุณแลกของรางวัลนี้ไปแล้ว';
  const dailyMessage = `วันนี้แลกครบ ${rules.perDay} สิทธิ์แล้ว พรุ่งนี้มาแลกต่อได้นะ`;
  if (held.length >= rules.max) throw new RewardError(fullMessage, 409);
  if (rules.perDay !== null && held.filter((r) => r.createdAt >= bangkokDayStart()).length >= rules.perDay) throw new RewardError(dailyMessage, 409);
  if (current.points.balance < reward.costXp) {
    throw new RewardError(`XP ไม่พอ ต้องการอีก ${(reward.costXp - current.points.balance).toLocaleString()} XP`);
  }
  // The check above is for a quick answer; the store checks again under a per-member lock, so two redemptions sent
  // together cannot spend the same XP twice (database review item 1)
  const added = await redemptionStore.add({ memberId, rewardId, cost: reward.costXp }, current.points.earned, { ...rules, dayStart: bangkokDayStart() });
  if (added === 'duplicate') throw new RewardError(fullMessage, 409);
  if (added === 'daily') throw new RewardError(dailyMessage, 409);
  if (added === 'short') throw new RewardError('XP ไม่พอสำหรับของรางวัลนี้แล้ว');
  return rewardsOf(memberId);
}

/** Account deletion */
export async function removeRedemptionsBy(memberId: string): Promise<void> {
  await redemptionStore.removeBy(memberId);
}
