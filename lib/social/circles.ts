import { cacheManager } from '../cache';
import { db } from '../db';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { tidyDisplayName } from '../displayName';
import { memberRepository, type Member } from '../members';
import { momentRepository } from '../moments';
import { thaiTimeAgo } from '../moments/service';
import { closenessOf } from './closeness';
import { joinsOf } from './questJoins';
import { questMemberStore } from './stores';
import {
  ACHIEVEMENTS_WINDOW_DAYS,
  CIRCLES_FOLLOWING_MAX,
  CIRCLES_FRESH_POINTS,
  CIRCLES_GROUP_MIN,
  CIRCLES_HOT_MAX,
  CIRCLES_LIST_MAX,
  CIRCLES_OWN_MAX,
  CIRCLES_SUGGEST_BELOW,
} from './socialRules';
import { allQuestFinishes } from './questFinishes';
import { groupCircles, type GroupCircle } from './groupCircles';

/**
 * Circles (one item is a Circle; owner 2026-11-16) at the top of the member home feed, where other apps put stories (owner 2026-11-10: no stories,
 * show who achieved what). Two public facts make it: a finished challenge ("ใครทำอยู่บ้าง" is public on the challenge
 * page) and a post's challenge line ("พิชิตชาเลนจ์ … 2/3", lib/social/achievement.ts). One circle per person:
 * a finish beats a step, the newest wins. A reader with nothing achieved yet still sees their own circles for the
 * challenges they are on ("doing", owner 2026-11-11), up to three.
 *
 * Circles at scale (owner 2026-11-18), so the row still works with 100 to 1,000+ friends:
 * - Each reader's own query: the people they follow and themselves over the last 14 days, not the site's newest posts
 *   (those pushed friends out once traffic grew). Never a stranger's face as if followed (owner 2026-11-18): a reader
 *   following few people gets "กำลังฮิต" challenge Circles instead (the challenge's picture; opened, the people doing
 *   it, each with ติดตาม) and a "หาเพื่อน" Circle (Circles.tsx), so the row is alive and leads to following.
 * - Order by closeness (lib/social/closeness.ts: done together, talked, follow back) plus freshness, not mutual-then-newest.
 * - 2+ friends on the same challenge become one Circle ("เพื่อน 8 คน"), opened as a list with a cheer for each.
 * - Up to CIRCLES_LIST_MAX come back; the row shows the first ones and a "ดูทั้งหมด" Circle for the rest (Circles.tsx).
 */

const WINDOW_DAYS = ACHIEVEMENTS_WINDOW_DAYS;

export interface AchievementCircle {
  id: string;
  person: { id: string; name: string; avatar?: string };
  isMe: boolean;
  kind: 'finish' | 'step' | 'doing';
  /** Doing circles show the challenge's picture: the reader's own face three times says nothing */
  quest: { id: string; title: string; image?: string };
  current?: number;
  total?: number;
  /** The post a step circle opens (finishes open the challenge) */
  momentId?: string;
  href: string;
  timeAgo: string;
  at: string;
}

/**
 * Friends on the same challenge in one Circle (`c:<questId>`); each person keeps their own Circle id for "ชื่นชม".
 * A hot challenge (`h:<questId>`, `suggested` set) has the same shape, with people the reader does not follow yet.
 */
export interface ChallengeCircle {
  id: string;
  kind: 'challenge';
  /** A hot challenge suggested to a reader who follows few people: how many people are doing it */
  suggested?: { total: number };
  quest: { id: string; title: string; image?: string };
  /** Closest first */
  people: AchievementCircle[];
  /** How many of them finished it */
  finished: number;
  href: string;
  timeAgo: string;
  at: string;
}

/** One Circle in the row: a person's challenge, friends on one challenge, or a group back from a ตี้ (lib/social/groupCircles.ts) */
export type CircleItem = AchievementCircle | ChallengeCircle | GroupCircle;
export type { GroupCircle };


type Raw = Omit<AchievementCircle, 'person' | 'isMe' | 'timeAgo'> & { memberId: string };

/** A challenge by its id; the sample posts' challenge lines carry the database uuid instead of the slug, so that is tried too */
export async function findQuest(id: string) {
  const quest = await db.findQuestById(id);
  if (quest || !USE_POSTGRES || !/^[0-9a-f-]{36}$/.test(id)) return quest;
  const [row] = await sql()`select slug from app.quests where id::text = ${id}`;
  return row ? db.findQuestById(String(row.slug)) : null;
}

/** A challenge's picture as its page shows it: many official challenges carry only the badge cover (owner 2026-11-18: Sound Bath opened with no picture) */
export const questPicture = (quest: { image?: string; badgeCoverImg?: string }): string | undefined => quest.badgeCoverImg || quest.image || undefined;

/** A new step or finish shows in Circles at once on this server, instead of after the minute the list is kept */
export const forgetCircles = () => cacheManager.invalidateTag('achievements');

/** Finishes and challenge-line posts into Circles, dropping challenges that are drafts or gone */
async function toRaw(finishes: { memberId: string; questId: string; finishedAt: string }[], steps: Awaited<ReturnType<typeof momentRepository.recentAchievements>>): Promise<Raw[]> {
  // A post's line counts only while its challenge can be seen (not a draft), under the challenge's own id
  const live = new Map<string, { id: string; title: string; image?: string }>();
  for (const id of new Set(steps.map((s) => s.achievement.questId))) {
    const quest = await findQuest(id);
    if (quest && quest.status !== 'draft') live.set(id, { id: quest.id, title: quest.title, image: questPicture(quest) });
  }
  const titles = new Map<string, { id: string; title: string; image?: string }>();
  for (const id of new Set(finishes.map((f) => f.questId))) {
    const quest = await db.findQuestById(id);
    if (quest && quest.status !== 'draft') titles.set(id, { id, title: quest.title, image: questPicture(quest) });
  }
  return [
    ...finishes.flatMap((f): Raw[] =>
      titles.has(f.questId)
        ? [{ id: `f:${f.questId}:${f.memberId}`, memberId: f.memberId, kind: 'finish', quest: titles.get(f.questId)!, href: `/challenges/${encodeURIComponent(f.questId)}`, at: f.finishedAt }]
        : []
    ),
    ...steps.filter((s) => live.has(s.achievement.questId)).map((s): Raw => ({
      id: `s:${s.momentId}`,
      memberId: s.authorId,
      kind: s.achievement.current >= s.achievement.total ? 'finish' : 'step',
      quest: live.get(s.achievement.questId)!,
      current: s.achievement.current,
      total: s.achievement.total,
      momentId: s.momentId,
      href: `/moments/${encodeURIComponent(s.momentId)}`,
      at: s.createdAt,
    })),
  ];
}

const sinceIso = () => new Date(Date.now() - WINDOW_DAYS * 86_400_000);

/** A short fingerprint of the follow list, so a new follow shows at once instead of after the 90 seconds */
const listKey = (ids: string[]) => {
  let h = 0;
  for (const id of ids) for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return `${ids.length}:${(h >>> 0).toString(36)}`;
};

/** The reader's and their friends' Circles in the window: read per reader, kept 90 seconds */
const friendsRaw = (readerId: string, ids: string[]) =>
  cacheManager.getOrSet(
    `circles:${readerId}:${listKey(ids)}`,
    async (): Promise<Raw[]> => {
      const since = sinceIso();
      const [finishes, steps] = await Promise.all([
        questMemberStore.finishes({ memberIds: ids, since: since.toISOString() }),
        // A database without migration 0040 has no challenge lines yet
        momentRepository.recentAchievements(since, 500, ids).catch(() => []),
      ]);
      return toRaw(finishes, steps);
    },
    { ttlMs: 90_000, tags: ['achievements'] }
  );

/** The site's newest steps and finishes, the same for every reader: only to find hot challenges for a reader who follows few */
const everyone = () =>
  cacheManager.getOrSet(
    'circles',
    async (): Promise<Raw[]> => {
      const since = sinceIso();
      const [finishes, steps] = await Promise.all([
        allQuestFinishes().then((all) => all.filter((f) => Date.parse(f.finishedAt) >= since.getTime()).slice(0, 100)),
        momentRepository.recentAchievements(since, 100).catch(() => []),
      ]);
      return toRaw(finishes, steps);
    },
    { ttlMs: 60_000, tags: ['achievements'] }
  );

/**
 * Hot challenges: open challenges with the most people achieving something on them lately, leaving out ones the reader
 * already sees. Each keeps its people (one entry per person, a finish beating a step), none the reader follows.
 */
async function hotChallenges(readerId: string, skipPerson: (id: string) => boolean, skipQuest: Set<string>): Promise<{ questId: string; total: number; people: Raw[] }[]> {
  const byQuest = new Map<string, Map<string, Raw>>();
  for (const item of await everyone()) {
    if (item.memberId === readerId || skipPerson(item.memberId) || skipQuest.has(item.quest.id)) continue;
    const people = byQuest.get(item.quest.id) ?? new Map<string, Raw>();
    const held = people.get(item.memberId);
    if (!held || (item.kind === 'finish' && held.kind === 'step') || (item.kind === held.kind && item.at > held.at)) people.set(item.memberId, item);
    byQuest.set(item.quest.id, people);
  }
  const newest = (people: Map<string, Raw>) => [...people.values()].reduce((a, b) => (a.at > b.at ? a : b)).at;
  const ranked = [...byQuest.entries()].sort((a, b) => b[1].size - a[1].size || newest(b[1]).localeCompare(newest(a[1])));
  const hot: { questId: string; total: number; people: Raw[] }[] = [];
  for (const [questId, people] of ranked) {
    if (hot.length >= CIRCLES_HOT_MAX) break;
    const quest = await db.findQuestById(questId);
    // Only one the reader can still join
    if (!quest || quest.status === 'ended' || quest.status === 'draft') continue;
    const joined = await questMemberStore.joins({ questId }).catch(() => []);
    hot.push({ questId, total: Math.max((quest.participantsCount ?? 0) + joined.length, people.size), people: [...people.values()].sort((a, b) => b.at.localeCompare(a.at)) });
  }
  return hot;
}

/**
 * The reader's own "doing" circles: the newest challenges they joined and have not finished, still open. The challenge
 * that already has the reader's step or finish circle is left out; the others stay (2026-11-18: one posted step used to
 * hide every other challenge they were on).
 */
async function doingOf(memberId: string, shown: Set<string>, max: number): Promise<Raw[]> {
  const [joins, finishes] = await Promise.all([joinsOf(memberId), questMemberStore.finishes({ memberId })]);
  const done = new Set(finishes.map((f) => f.questId));
  const open = joins.filter((join) => !done.has(join.questId) && !shown.has(join.questId)).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  const items: Raw[] = [];
  for (const join of open) {
    if (items.length >= max) break;
    const quest = await db.findQuestById(join.questId);
    if (!quest || quest.status === 'ended' || quest.status === 'draft') continue;
    items.push({ id: `d:${join.questId}:${memberId}`, memberId, kind: 'doing', quest: { id: join.questId, title: quest.title, image: questPicture(quest) }, href: `/challenges/${encodeURIComponent(join.questId)}`, at: join.joinedAt });
  }
  return items;
}

/** One circle per person: a finish beats a step, then the newest */
function bestPerPerson(items: Raw[], skip: (memberId: string) => boolean): Map<string, Raw> {
  const best = new Map<string, Raw>();
  for (const item of items) {
    if (skip(item.memberId)) continue;
    const held = best.get(item.memberId);
    const better = !held || (item.kind === 'finish' && held.kind === 'step') || (item.kind === held.kind && item.at > held.at);
    if (better) best.set(item.memberId, item);
  }
  return best;
}

const freshPoints = (at: string, now: number) => {
  const hours = (now - Date.parse(at)) / 3_600_000;
  return CIRCLES_FRESH_POINTS.find((step) => hours <= step.hours)?.points ?? 0;
};

/** Whether the row ends with "หาเพื่อน" (people worth following): while the reader follows few people */
export const wantsFindPeople = (viewer: Member): boolean => (viewer.followingIds ?? []).filter((id) => id !== viewer.id).length < CIRCLES_SUGGEST_BELOW;

export async function circleItems(viewer: Member): Promise<CircleItem[]> {
  const blocked = new Set(viewer.blockedIds ?? []);
  const following = (viewer.followingIds ?? []).filter((id) => !blocked.has(id) && id !== viewer.id).slice(0, CIRCLES_FOLLOWING_MAX);
  const friendSet = new Set(following);
  // Only the reader and the people they follow (owner 2026-11-18): strangers' Circles filling a new member's row read
  // as people they had followed
  const best = bestPerPerson(await friendsRaw(viewer.id, [viewer.id, ...following]), (id) => blocked.has(id));
  const mineBest = best.get(viewer.id);
  const [doing, groups] = await Promise.all([
    doingOf(viewer.id, new Set(mineBest ? [mineBest.quest.id] : []), mineBest ? CIRCLES_OWN_MAX - 1 : CIRCLES_OWN_MAX).catch((): Raw[] => []),
    groupCircles(viewer).catch((error): GroupCircle[] => {
      console.error('groupCircles failed:', error);
      return [];
    }),
  ]);
  // Hot challenges only while the reader follows few people, never one already in their row
  const seenQuests = new Set([...doing, ...best.values()].map((item) => item.quest.id));
  const hot = following.length < CIRCLES_SUGGEST_BELOW
    ? await hotChallenges(viewer.id, (id) => blocked.has(id) || friendSet.has(id), seenQuests).catch((error) => {
        console.error('hotChallenges failed:', error);
        return [];
      })
    : [];
  if (best.size === 0 && doing.length === 0 && hot.length === 0) return groups;

  const friendIds = [...best.keys()].filter((id) => id !== viewer.id);
  const hotIds = hot.flatMap((h) => h.people.map((p) => p.memberId));
  const [people, followers] = await Promise.all([memberRepository.findByIds([...best.keys(), ...hotIds, viewer.id]), memberRepository.followerIds(viewer.id)]);
  const mutual = new Set(followers.filter((id) => friendSet.has(id)));
  // Closeness is asked only for friends who have a Circle now: a handful, whatever the size of the follow list
  const closeness = await closenessOf(viewer.id, friendIds, mutual).catch((error) => {
    console.error('closenessOf failed:', error);
    return new Map(friendIds.map((id) => [id, mutual.has(id) ? 1 : 0]));
  });
  const now = Date.now();
  const toCircle = (item: Raw): AchievementCircle[] => {
    const person = people.get(item.memberId);
    if (!person || person.status !== 'active' || person.blockedIds?.includes(viewer.id)) return [];
    const { memberId, ...rest } = item;
    return [{ ...rest, person: { id: memberId, name: tidyDisplayName(person.displayName).trim() || person.displayName, avatar: person.avatarUrl }, isMe: memberId === viewer.id, timeAgo: thaiTimeAgo(item.at, now) }];
  };
  const score = (circle: AchievementCircle) => (closeness.get(circle.person.id) ?? 0) + freshPoints(circle.at, now);

  const mine = [...doing, ...(mineBest ? [mineBest] : [])].flatMap(toCircle).sort((a, b) => b.at.localeCompare(a.at));
  const friends = friendIds.flatMap((id) => toCircle(best.get(id)!)).sort((a, b) => score(b) - score(a) || b.at.localeCompare(a.at));

  // Friends on the same challenge: one Circle, placed where its closest friend would be
  const byQuest = new Map<string, AchievementCircle[]>();
  for (const circle of friends) byQuest.set(circle.quest.id, [...(byQuest.get(circle.quest.id) ?? []), circle]);
  const ranked: { item: AchievementCircle | ChallengeCircle; score: number }[] = [];
  for (const [questId, members] of byQuest) {
    if (members.length < CIRCLES_GROUP_MIN) {
      ranked.push({ item: members[0], score: score(members[0]) });
      continue;
    }
    const newest = members.reduce((a, b) => (a.at > b.at ? a : b));
    ranked.push({
      item: {
        id: `c:${questId}`,
        kind: 'challenge',
        quest: members[0].quest,
        people: members,
        finished: members.filter((m) => m.kind === 'finish').length,
        href: `/challenges/${encodeURIComponent(questId)}`,
        timeAgo: newest.timeAgo,
        at: newest.at,
      },
      // A crowd on one challenge is worth a little more than its closest friend alone
      score: Math.max(...members.map(score)) + Math.min(members.length - 1, 3),
    });
  }
  ranked.sort((a, b) => b.score - a.score || b.item.at.localeCompare(a.item.at));
  const suggested = hot.flatMap(({ questId, total, people: raw }): ChallengeCircle[] => {
    const members = raw.flatMap(toCircle);
    if (members.length === 0) return [];
    return [{
      id: `h:${questId}`,
      kind: 'challenge',
      suggested: { total },
      quest: members[0].quest,
      people: members,
      finished: members.filter((m) => m.kind === 'finish').length,
      href: `/challenges/${encodeURIComponent(questId)}`,
      timeAgo: members[0].timeAgo,
      at: members[0].at,
    }];
  });
  // Group Circles come right after the reader's own: a ตี้ just back from is the freshest thing friends did together.
  // Suggestions come last: friends always first
  return [...mine, ...groups, ...ranked.map((r) => r.item), ...suggested].slice(0, CIRCLES_LIST_MAX);
}

/** What a friends-on-one-challenge Circle needs when opened: who the reader already cheered, and their own place in it */
export interface ChallengeCircleDetail {
  id: string;
  open: boolean;
  joined: boolean;
  finished: boolean;
  /** Circle ids of the people the reader already cheered */
  cheered: string[];
}
