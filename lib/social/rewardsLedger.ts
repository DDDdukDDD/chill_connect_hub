import { randomUUID } from 'node:crypto';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { createJsonStore } from './jsonStore';
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

const store = createJsonStore<Redemption>('redemptions');

const redemptionsOf = (memberId: string) => store.read().filter((r) => r.memberId === memberId);

/** Points, challenge progress and redeemed rewards of one member */
export async function rewardsOf(memberId: string) {
  const progress = await progressOf(memberId);
  const redemptions = redemptionsOf(memberId);
  const spent = redemptions.reduce((sum, r) => sum + r.cost, 0);
  return {
    points: { ...progress.points, earned: progress.points.total, spent, balance: Math.max(0, progress.points.total - spent) },
    quests: progress.quests,
    redeemedRewardIds: redemptions.map((r) => r.rewardId),
    redemptions: redemptions.map(({ rewardId, cost, createdAt }) => ({ rewardId, cost, createdAt })),
  };
}

/** One of each reward per member; the balance must cover the price */
export async function redeemReward(memberId: string, rewardId: string) {
  const reward = REWARD_SHOP_ITEMS.find((item) => item.id === rewardId);
  if (!reward) throw new RewardError('ไม่พบของรางวัลนี้', 404);
  const current = await rewardsOf(memberId);
  if (current.redeemedRewardIds.includes(rewardId)) throw new RewardError('คุณแลกของรางวัลนี้ไปแล้ว', 409);
  if (current.points.balance < reward.costXp) {
    throw new RewardError(`แต้มไม่พอ ต้องการอีก ${(reward.costXp - current.points.balance).toLocaleString()} แต้ม`);
  }
  const saved: Redemption = { id: `red_${randomUUID()}`, memberId, rewardId, cost: reward.costXp, createdAt: new Date().toISOString() };
  await store.update((items) => [saved, ...items]);
  return rewardsOf(memberId);
}

/** Account deletion */
export async function removeRedemptionsBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((r) => r.memberId !== memberId));
}
