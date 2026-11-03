import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
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

/** A draw entry gets its own code from the redemption id; a voucher keeps the partner's code (null here) */
const entryCodeOf = (redemptionId: string, rewardId: string): string | null =>
  REWARD_SHOP_ITEMS.find((item) => item.id === rewardId)?.drawEntry ? `CC-${redemptionId.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase()}` : null;

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
    redeemedRewardIds: redemptions.map((r) => r.rewardId),
    redemptions: redemptions.map(({ id, rewardId, cost, createdAt }) => ({ rewardId, cost, createdAt, code: entryCodeOf(id, rewardId) })),
  };
}

/** One of each reward per member; the balance must cover the price */
export async function redeemReward(memberId: string, rewardId: string) {
  const reward = REWARD_SHOP_ITEMS.find((item) => item.id === rewardId);
  if (!reward) throw new RewardError('ไม่พบของรางวัลนี้', 404);
  const current = await rewardsOf(memberId);
  if (current.redeemedRewardIds.includes(rewardId)) throw new RewardError('คุณแลกของรางวัลนี้ไปแล้ว', 409);
  if (current.points.balance < reward.costXp) {
    throw new RewardError(`XP ไม่พอ ต้องการอีก ${(reward.costXp - current.points.balance).toLocaleString()} XP`);
  }
  // The database refuses a second one, should two requests pass the check above together
  if (!(await redemptionStore.add({ memberId, rewardId, cost: reward.costXp }))) throw new RewardError('คุณแลกของรางวัลนี้ไปแล้ว', 409);
  return rewardsOf(memberId);
}

/** Account deletion */
export async function removeRedemptionsBy(memberId: string): Promise<void> {
  await redemptionStore.removeBy(memberId);
}
