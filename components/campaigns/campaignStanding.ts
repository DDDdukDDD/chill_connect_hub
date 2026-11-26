import type { CampaignView } from '@/lib/campaigns/types';

interface RewardsPart {
  balance: number;
  quests: { questId: string; completed: boolean; joined: boolean }[];
  redeemedRewardIds: string[];
}

/**
 * Where a member stands in one campaign: XP against the reward's price, the steps done, and whether they redeemed it.
 * Each reward is redeemed once (guaranteed rewards only, owner 2026-11-23)
 */
export function campaignStanding(campaign: CampaignView, rewards: RewardsPart) {
  const prize = campaign.prize;
  const cost = prize?.costXp ?? 0;
  const short = Math.max(0, cost - rewards.balance);
  const entered = prize ? rewards.redeemedRewardIds.includes(prize.id) : false;
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
