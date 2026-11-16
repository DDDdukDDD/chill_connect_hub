import { cacheManager } from '../cache';
import { db } from '../db';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { tidyDisplayName } from '../displayName';
import { memberRepository, type Member } from '../members';
import { momentRepository } from '../moments';
import { thaiTimeAgo } from '../moments/service';
import { allQuestFinishes } from './questFinishes';
import { joinsOf } from './questJoins';
import { questMemberStore } from './stores';
import { ACHIEVEMENTS_ROW_MAX, ACHIEVEMENTS_WINDOW_DAYS } from './socialRules';
import { groupCircles, type GroupCircle } from './groupCircles';

/**
 * Circles (one item is a Circle; owner 2026-11-16) at the top of the member home feed, where other apps put stories (owner 2026-11-10: no stories,
 * show who achieved what). Two public facts make it: a finished challenge ("ใครทำอยู่บ้าง" is public on the challenge
 * page) and a post's challenge line ("พิชิตชาเลนจ์ … 2/3", lib/social/achievement.ts). One circle per person:
 * a finish beats a step, the newest wins. The reader comes first, then people they follow (mutual first), then others.
 * A reader with nothing achieved yet still sees their own circles for the challenges they are on ("doing", owner
 * 2026-11-11: what I took on in onboarding shows on my home), up to three (2026-11-14: onboarding joins three first steps).
 */

const WINDOW_DAYS = ACHIEVEMENTS_WINDOW_DAYS;
const ROW_MAX = ACHIEVEMENTS_ROW_MAX;

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

/** One Circle in the row: a person's challenge, or a group back from a ตี้ (round B, lib/social/groupCircles.ts) */
export type CircleItem = AchievementCircle | GroupCircle;
export type { GroupCircle };

type Raw = Omit<AchievementCircle, 'person' | 'isMe' | 'timeAgo'> & { memberId: string };

/** A challenge by its id; the sample posts' challenge lines carry the database uuid instead of the slug, so that is tried too */
export async function findQuest(id: string) {
  const quest = await db.findQuestById(id);
  if (quest || !USE_POSTGRES || !/^[0-9a-f-]{36}$/.test(id)) return quest;
  const [row] = await sql()`select slug from app.quests where id::text = ${id}`;
  return row ? db.findQuestById(String(row.slug)) : null;
}

/** Everyone's achievements in the window, the same for every reader: read at most once a minute */
const everyone = () =>
  cacheManager.getOrSet(
    'circles',
    async (): Promise<Raw[]> => {
      const since = Date.now() - WINDOW_DAYS * 86_400_000;
      const [finishes, steps] = await Promise.all([
        allQuestFinishes().then((all) => all.filter((f) => Date.parse(f.finishedAt) >= since)),
        // A database without migration 0040 has no challenge lines yet
        momentRepository.recentAchievements(new Date(since), 200).catch(() => []),
      ]);
      // A post's line counts only while its challenge can be seen (not a draft), under the challenge's own id
      const live = new Map<string, { id: string; title: string }>();
      for (const id of new Set(steps.map((s) => s.achievement.questId))) {
        const quest = await findQuest(id);
        if (quest && quest.status !== 'draft') live.set(id, { id: quest.id, title: quest.title });
      }
      const titles = new Map<string, string>();
      for (const id of new Set(finishes.map((f) => f.questId))) {
        const quest = await db.findQuestById(id);
        if (quest) titles.set(id, quest.title);
      }
      return [
        ...finishes.flatMap((f): Raw[] =>
          titles.has(f.questId)
            ? [{ id: `f:${f.questId}:${f.memberId}`, memberId: f.memberId, kind: 'finish', quest: { id: f.questId, title: titles.get(f.questId) as string }, href: `/challenges/${encodeURIComponent(f.questId)}`, at: f.finishedAt }]
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
    },
    { ttlMs: 60_000, tags: ['achievements'] }
  );

/** The reader's own "doing" circles: the newest challenges they joined and have not finished, still open */
const DOING_MAX = 3;
async function doingOf(memberId: string): Promise<Raw[]> {
  const [joins, finishes] = await Promise.all([joinsOf(memberId), questMemberStore.finishes({ memberId })]);
  const done = new Set(finishes.map((f) => f.questId));
  const open = joins.filter((join) => !done.has(join.questId)).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  const items: Raw[] = [];
  for (const join of open) {
    if (items.length >= DOING_MAX) break;
    const quest = await db.findQuestById(join.questId);
    if (!quest || quest.status === 'ended') continue;
    items.push({ id: `d:${join.questId}:${memberId}`, memberId, kind: 'doing', quest: { id: join.questId, title: quest.title, image: quest.image }, href: `/challenges/${encodeURIComponent(join.questId)}`, at: join.joinedAt });
  }
  return items;
}

export async function circleItems(viewer: Member): Promise<CircleItem[]> {
  const blocked = new Set(viewer.blockedIds ?? []);
  // One circle per person: a finish beats a step, then the newest
  const best = new Map<string, Raw>();
  for (const item of await everyone()) {
    if (blocked.has(item.memberId)) continue;
    const held = best.get(item.memberId);
    const better = !held || (item.kind === 'finish' && held.kind === 'step') || (item.kind === held.kind && item.at > held.at);
    if (better) best.set(item.memberId, item);
  }
  const [doing, groups] = await Promise.all([
    best.has(viewer.id) ? [] : doingOf(viewer.id).catch((): Raw[] => []),
    groupCircles(viewer).catch((error): GroupCircle[] => {
      console.error('groupCircles failed:', error);
      return [];
    }),
  ]);
  if (best.size === 0 && doing.length === 0) return groups;
  const [people, followers] = await Promise.all([memberRepository.findByIds([...best.keys(), viewer.id]), memberRepository.followerIds(viewer.id)]);
  const following = new Set(viewer.followingIds ?? []);
  const mutual = new Set(followers.filter((id) => following.has(id)));
  const rank = (id: string) => (id === viewer.id ? 0 : mutual.has(id) ? 1 : following.has(id) ? 2 : 3);
  const now = Date.now();
  const personal = [...doing, ...best.values()]
    .flatMap((item): AchievementCircle[] => {
      const person = people.get(item.memberId);
      if (!person || person.status !== 'active' || person.blockedIds?.includes(viewer.id)) return [];
      const { memberId, ...rest } = item;
      return [{ ...rest, person: { id: memberId, name: tidyDisplayName(person.displayName).trim() || person.displayName, avatar: person.avatarUrl }, isMe: memberId === viewer.id, timeAgo: thaiTimeAgo(item.at, now) }];
    })
    .sort((a, b) => rank(a.person.id) - rank(b.person.id) || b.at.localeCompare(a.at));
  // Group Circles come right after the reader's own: a ตี้ just back from is the freshest thing friends did together
  const mine = personal.filter((item) => item.isMe).length;
  return [...personal.slice(0, mine), ...groups, ...personal.slice(mine)].slice(0, ROW_MAX);
}
