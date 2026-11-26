import { bangkokToday } from '../campaigns/types';
import { findReward } from '../rewards/catalog';
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
  const redemptions = await redemptionStore.ofMember(memberId);
  const spent = redemptions.reduce((sum, r) => sum + r.cost, 0);
  return {
    points: { ...progress.points, earned: progress.points.total, spent, balance: Math.max(0, progress.points.total - spent) },
    quests: progress.quests,
    joinedQuestIds: await joinedQuestIdsOf(memberId),
    /** Challenges the member finished: the badge, and the code when a partner gives the reward */
    finished: await finishesOf(memberId),
    redeemedRewardIds: [...new Set(redemptions.map((r) => r.rewardId))],
    redemptions: redemptions.map(({ rewardId, cost, createdAt }) => ({ rewardId, cost, createdAt })),
  };
}

/** When today began in Bangkok (the store still takes a daily limit) */
const bangkokDayStart = () => new Date(`${bangkokToday()}T00:00:00+07:00`).toISOString();

/**
 * Each reward once per member (prize draws with several entries were removed 2026-11-26). The balance must cover the price
 */
export async function redeemReward(memberId: string, rewardId: string) {
  const reward = await findReward(rewardId);
  if (!reward || reward.hidden) throw new RewardError('ไม่พบของรางวัลนี้', 404);
  const current = await rewardsOf(memberId);
  const fullMessage = 'คุณแลกของรางวัลนี้ไปแล้ว';
  if (current.redeemedRewardIds.includes(rewardId)) throw new RewardError(fullMessage, 409);
  if (current.points.balance < reward.costXp) {
    throw new RewardError(`XP ไม่พอ ต้องการอีก ${(reward.costXp - current.points.balance).toLocaleString()} XP`);
  }
  // The check above is for a quick answer; the store checks again under a per-member lock, so two redemptions sent
  // together cannot spend the same XP twice (database review item 1)
  const added = await redemptionStore.add({ memberId, rewardId, cost: reward.costXp }, current.points.earned, { max: 1, perDay: null, dayStart: bangkokDayStart() });
  if (added === 'duplicate') throw new RewardError(fullMessage, 409);
  if (added === 'short') throw new RewardError('XP ไม่พอสำหรับของรางวัลนี้แล้ว');
  return rewardsOf(memberId);
}

/** Account deletion */
export async function removeRedemptionsBy(memberId: string): Promise<void> {
  await redemptionStore.removeBy(memberId);
}
