import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import type { CampaignView } from '@/lib/campaigns/types';

interface RewardsPart {
  balance: number;
  quests: { questId: string; completed: boolean; joined: boolean }[];
  redeemedRewardIds: string[];
}

/** Where a member stands in one campaign: XP against the prize's price, and the steps done */
export function campaignStanding(campaign: CampaignView, rewards: RewardsPart) {
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign.rewardId);
  const cost = prize?.costXp ?? 0;
  const short = Math.max(0, cost - rewards.balance);
  const entered = Boolean(prize && rewards.redeemedRewardIds.includes(prize.id));
  const done = campaign.steps.filter((step) => rewards.quests.some((item) => item.questId === step.id && item.completed && item.joined)).length;
  return {
    prize,
    cost,
    short,
    entered,
    ready: Boolean(prize) && !entered && short === 0 && done === campaign.steps.length,
    percent: Math.min(100, Math.round((rewards.balance / Math.max(1, cost)) * 100)),
    done,
    total: campaign.steps.length,
  };
}
