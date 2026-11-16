import { entryRulesOf } from '@/data/rewardsData';
import type { CampaignView } from '@/lib/campaigns/types';

interface RewardsPart {
  balance: number;
  quests: { questId: string; completed: boolean; joined: boolean }[];
  redeemedRewardIds: string[];
  entryCount?: Record<string, number>;
  entryToday?: Record<string, number>;
}

/**
 * Where a member stands in one campaign: XP against the prize's price, the steps done, and the entries held. A draw
 * may allow several entries (BE-391): `ready` then also means "one more can be redeemed now"
 */
export function campaignStanding(campaign: CampaignView, rewards: RewardsPart) {
  const prize = campaign.prize;
  const cost = prize?.costXp ?? 0;
  const short = Math.max(0, cost - rewards.balance);
  const entries = prize ? (rewards.entryCount?.[prize.id] ?? (rewards.redeemedRewardIds.includes(prize.id) ? 1 : 0)) : 0;
  const entered = entries > 0;
  const rules = prize ? entryRulesOf(prize) : { max: 1, perDay: null };
  const todayFull = rules.perDay !== null && (prize ? (rewards.entryToday?.[prize.id] ?? 0) : 0) >= rules.perDay;
  /** Another entry is allowed by the reward's limits (XP and steps aside) */
  const canAddEntry = entries < rules.max && !todayFull;
  const done = campaign.steps.filter((step) => rewards.quests.some((item) => item.questId === step.id && item.completed && item.joined)).length;
  return {
    prize,
    cost,
    short,
    entered,
    entries,
    maxEntries: rules.max,
    /** Today's limit is reached; tomorrow opens again */
    todayFull: entries < rules.max && todayFull,
    canAddEntry,
    ready: Boolean(prize) && canAddEntry && short === 0 && done === campaign.steps.length,
    percent: Math.min(100, Math.round((rewards.balance / Math.max(1, cost)) * 100)),
    done,
    total: campaign.steps.length,
  };
}
