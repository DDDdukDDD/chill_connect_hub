import { momentRepository } from '../moments';
import { evidencePassed } from '../moments/evidence';
import type { Moment, MomentAchievement } from '../moments/types';
import { progressOf, rewardsForTargets } from './questProgress';
import { isVisitTargetType, targetKey } from './visits';

/**
 * The challenge line on a new post (FEED_PLAN step 3.5): a challenge the author joined that counts this place, ตี้ or
 * อีเวนต์, with how far they are now. The same answer the "นับให้ชาเลนจ์แล้ว" notice gives after posting
 * (components/moments/publishMoment.ts). A photo still waiting for staff counts for nothing yet, so it gets no line.
 * Worked out once here and kept on the post, so no feed ever reads progress.
 */
export async function achievementFor(memberId: string, moment: Moment): Promise<MomentAchievement | undefined> {
  if (!moment.targetId || !isVisitTargetType(moment.targetType) || !evidencePassed(moment)) return undefined;
  const target = { targetType: moment.targetType, targetId: moment.targetId };
  const [{ quests }, rewards] = await Promise.all([progressOf(memberId), rewardsForTargets([target])]);
  const here = new Set((rewards[targetKey(target.targetType, target.targetId)] ?? []).map((reward) => reward.questId));
  const quest = quests.find((q) => q.joined && q.current > 0 && here.has(q.questId));
  return quest ? { questId: quest.questId, title: quest.title, current: quest.current, total: quest.total } : undefined;
}

/** Adds the line to a post just made; any failure (a database without migration 0040) leaves the post as it is */
export async function recordAchievement(memberId: string, moment: Moment): Promise<Moment> {
  try {
    const achievement = await achievementFor(memberId, moment);
    if (!achievement) return moment;
    await momentRepository.setAchievement(moment.id, achievement);
    return { ...moment, achievement };
  } catch (error) {
    console.warn('Moment achievement:', (error as Error).message);
    return moment;
  }
}
