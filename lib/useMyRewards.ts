'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChallengeQuest } from '@/data/mockData';

/**
 * The signed-in member's points, challenge progress and redeemed rewards, from the account (GET /api/rewards).
 * Points come from real visits and finished challenges; nothing is kept in the browser.
 */
export interface QuestProgress {
  questId: string;
  title: string;
  current: number;
  total: number;
  completed: boolean;
  rewardPoints: number;
}

interface RewardsState {
  isLoaded: boolean;
  balance: number;
  earned: number;
  spent: number;
  quests: QuestProgress[];
  redeemedRewardIds: string[];
}

const EMPTY: RewardsState = { isLoaded: false, balance: 0, earned: 0, spent: 0, quests: [], redeemedRewardIds: [] };

interface RewardsAnswer {
  success: boolean;
  message?: string;
  points: { balance: number; earned: number; spent: number };
  quests: QuestProgress[];
  redeemedRewardIds: string[];
}

const toState = (data: RewardsAnswer): RewardsState => ({
  isLoaded: true,
  balance: data.points.balance,
  earned: data.points.earned,
  spent: data.points.spent,
  quests: data.quests,
  redeemedRewardIds: data.redeemedRewardIds,
});

export function useMyRewards(isLoggedIn: boolean) {
  const [state, setState] = useState<RewardsState>(EMPTY);

  const refresh = useCallback(async () => {
    try {
      const data: RewardsAnswer = await fetch('/api/rewards', { cache: 'no-store' }).then((res) => res.json());
      if (data.success) setState(toState(data));
    } catch {
      setState((prev) => ({ ...prev, isLoaded: true }));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) void refresh();
    else setState({ ...EMPTY, isLoaded: true });
  }, [isLoggedIn, refresh]);

  /** Redeems a catalog reward; the answer carries the message to show when it is refused */
  const redeem = useCallback(async (rewardId: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const data: RewardsAnswer = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      }).then((res) => res.json());
      if (!data.success) return { ok: false, message: data.message };
      setState(toState(data));
      return { ok: true };
    } catch {
      return { ok: false, message: 'แลกของรางวัลไม่สำเร็จ กรุณาลองใหม่' };
    }
  }, []);

  return { ...state, refresh, redeem };
}

/**
 * Puts the server's count on the challenges it tracks (those with a rule). A challenge the server
 * does not track keeps the progress the member noted by hand; that progress earns no points.
 */
export function withRealProgress<T extends ChallengeQuest>(quests: T[], progress: QuestProgress[]): T[] {
  const byId = new Map(progress.map((p) => [p.questId, p]));
  return quests.map((quest) => {
    const real = byId.get(quest.id);
    if (!real) return quest;
    return {
      ...quest,
      current: String(real.current),
      total: String(real.total),
      progressPercent: Math.round((real.current / real.total) * 100),
      completedCountInfo: real.completed ? `ครบ ${real.total}/${real.total} แล้ว` : `${real.current}/${real.total}`,
    };
  });
}
