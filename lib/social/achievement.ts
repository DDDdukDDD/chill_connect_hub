import { momentRepository } from '../moments';
import { evidencePassed } from '../moments/evidence';
import type { Moment, MomentAchievement } from '../moments/types';
import { postCounts, progressOf, rewardsForTargets } from './questProgress';
import { isVisitTargetType, targetKey } from './visits';
import { forgetCircles } from './circles';

/**
 * The challenge line on a new post (FEED_PLAN step 3.5): a challenge the author joined that counts this place, ตี้ or
 * อีเวนต์, with how far they are now. The same answer the "นับให้ชาเลนจ์แล้ว" notice gives after posting
 * (components/moments/publishMoment.ts). A photo still waiting for staff counts for nothing yet, so it gets no line.
 * Since 2026-11-18 a challenge that counts posts (QuestRule.posts) gives its line too: the post is its step, and the
 * posting form opened from that challenge (its Circle or page) names it as `questId`, which wins when several count.
 * Worked out once here and kept on the post, so no feed ever reads progress.
 */
export async function achievementFor(memberId: string, moment: Moment, questId?: string): Promise<MomentAchievement | undefined> {
  const { quests } = await progressOf(memberId);
  if (moment.targetId && isVisitTargetType(moment.targetType) && evidencePassed(moment)) {
    const target = { targetType: moment.targetType, targetId: moment.targetId };
    const rewards = await rewardsForTargets([target]);
    const here = new Set((rewards[targetKey(target.targetType, target.targetId)] ?? []).map((reward) => reward.questId));
    const quest = quests.find((q) => q.joined && q.current > 0 && here.has(q.questId) && (!questId || q.questId === questId)) ?? quests.find((q) => q.joined && q.current > 0 && here.has(q.questId));
    if (quest) return { questId: quest.questId, title: quest.title, current: quest.current, total: quest.total };
  }
  if (moment.status !== 'published') return undefined;
  // A challenge that counts only posts made from it (QuestRule.posts.tagged) counts this one when its form named it
  const counts = (posts: NonNullable<(typeof quests)[number]['posts']>, m: Moment) => postCounts(posts, m, m.id === moment.id ? questId : undefined);
  const postQuests = quests.filter((q) => q.posts && counts(q.posts, moment)).sort((a, b) => Number(b.questId === questId) - Number(a.questId === questId));
  if (postQuests.length === 0) return undefined;
  const mine = (await momentRepository.query({ statuses: ['published'], authorId: memberId, sort: 'newest', page: 1, limit: 100 })).items;
  for (const quest of postQuests) {
    // This post's place among the posts that count, oldest first: a post after the last step is not a step
    const counted = mine.filter((m) => counts(quest.posts!, m)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const step = counted.findIndex((m) => m.id === moment.id) + 1;
    if (step > 0 && step <= quest.total) return { questId: quest.questId, title: quest.title, current: step, total: quest.total };
  }
  return undefined;
}

/** Adds the line to a post just made; any failure (a database without migration 0040) leaves the post as it is */
export async function recordAchievement(memberId: string, moment: Moment, questId?: string): Promise<Moment> {
  try {
    const achievement = await achievementFor(memberId, moment, questId);
    if (!achievement) return moment;
    await momentRepository.setAchievement(moment.id, achievement);
    // The new step shows in Circles at once on this server
    forgetCircles();
    return { ...moment, achievement };
  } catch (error) {
    console.warn('Moment achievement:', (error as Error).message);
    return moment;
  }
}
