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
  /** The member joined it; only then is the reward theirs */
  joined: boolean;
  rewardPoints: number;
}

/** A challenge the member finished: the badge, and the reward code when a partner gives the reward */
export interface FinishedQuest {
  questId: string;
  title: string;
  badgeLabel: string;
  finishedAt: string;
  voucherCode: string | null;
  voucherUsedAt: string | null;
  rewardTitle: string | null;
}

interface RewardsState {
  isLoaded: boolean;
  balance: number;
  earned: number;
  spent: number;
  quests: QuestProgress[];
  /** Challenges the member joined, newest first */
  joinedQuestIds: string[];
  finished: FinishedQuest[];
  redeemedRewardIds: string[];
}

const EMPTY: RewardsState = { isLoaded: false, balance: 0, earned: 0, spent: 0, quests: [], joinedQuestIds: [], finished: [], redeemedRewardIds: [] };

interface RewardsAnswer {
  success: boolean;
  message?: string;
  points: { balance: number; earned: number; spent: number };
  quests: QuestProgress[];
  joinedQuestIds?: string[];
  finished?: FinishedQuest[];
  redeemedRewardIds: string[];
}

const toState = (data: RewardsAnswer): RewardsState => ({
  isLoaded: true,
  balance: data.points.balance,
  earned: data.points.earned,
  spent: data.points.spent,
  quests: data.quests,
  joinedQuestIds: data.joinedQuestIds ?? [],
  finished: data.finished ?? [],
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

  /** Joins or leaves a challenge on the account; the answer carries the message to show when it is refused */
  const setJoined = useCallback(async (questId: string, action: 'join' | 'leave', reason?: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const data: RewardsAnswer = await fetch('/api/quests/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId, action, reason }),
      }).then((res) => res.json());
      if (!data.success) return { ok: false, message: data.message };
      setState(toState(data));
      return { ok: true };
    } catch {
      return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
    }
  }, []);
  const joinQuest = useCallback((questId: string) => setJoined(questId, 'join'), [setJoined]);
  const leaveQuest = useCallback((questId: string, reason?: string) => setJoined(questId, 'leave', reason), [setJoined]);

  return { ...state, refresh, redeem, joinQuest, leaveQuest };
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

/** Browser copy of the member's challenge list. The account decides what is in it; the copy only keeps progress noted by hand. */
const MY_CHALLENGES_KEY = 'cch_my_challenges';

/**
 * Brings the browser copy in line with the account: the joined challenges, in the account's order, each with the
 * catalog's current details. Progress the member noted by hand on a challenge the server does not count is kept.
 */
export function syncMyChallenges(joinedQuestIds: string[], catalog: ChallengeQuest[]): ChallengeQuest[] {
  let noted: ChallengeQuest[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(MY_CHALLENGES_KEY) || '[]');
    if (Array.isArray(parsed)) noted = parsed;
  } catch {
    noted = [];
  }
  const notedById = new Map(noted.map((quest) => [quest.id, quest]));
  const catalogById = new Map(catalog.map((quest) => [quest.id, quest]));
  const list = joinedQuestIds.flatMap((id) => {
    const quest = catalogById.get(id);
    if (!quest) return [];
    const kept = notedById.get(id);
    const start = { progressPercent: 0, current: '0', completedCountInfo: `0/${quest.total || '3'}` };
    return [{ ...quest, ...(kept ? { progressPercent: kept.progressPercent, current: kept.current, completedCountInfo: kept.completedCountInfo } : start) }];
  });
  try {
    localStorage.setItem(MY_CHALLENGES_KEY, JSON.stringify(list));
  } catch {
    // The list still shows from the account; only hand-noted progress is not kept
  }
  return list;
}
