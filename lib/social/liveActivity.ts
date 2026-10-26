import { db } from '../db';
import { isEventEnded } from '../dateUtils';
import { tidyDisplayName } from '../displayName';
import { memberRepository, type Member } from '../members';
import { momentRepository } from '../moments';
import { isPubliclyVisible, loadPeople, thaiTimeAgo } from '../moments/service';
import { allQuestFinishes } from './questFinishes';
import { allQuestJoins } from './questJoins';

/**
 * "ตอนนี้ในชิลล์" on the home page: what members did lately, read from the stores that already hold it.
 *
 * Only actions that are public elsewhere become a named line: joining or opening a meetup (attendees are
 * public on the meetup page), joining or finishing a challenge ("ใครทำอยู่บ้าง" is public), and posting a moment.
 * Check-ins and "I have been here" marks never publish a name (see SocialProof in visits.ts), so they are left out.
 * Visitors who are not signed in get counts only, no names.
 */
export type LiveKind = 'meetup_join' | 'meetup_host' | 'quest_join' | 'quest_finish' | 'moment';

export interface LiveItem {
  id: string;
  kind: LiveKind;
  at: string;
  timeAgo: string;
  person: { name: string; avatar?: string };
  target: { type: 'community' | 'challenge' | 'spot' | 'fair' | 'general'; id?: string; title: string };
}

export interface LiveCounts {
  /** Start of the window the counts cover */
  since: string;
  meetupJoins: number;
  questJoins: number;
  moments: number;
}

interface RawItem {
  id: string;
  kind: LiveKind;
  at: string;
  memberId: string | null;
  fallback: { name: string; avatar?: string };
  target: LiveItem['target'];
}

const COUNT_WINDOW_DAYS = 7;
/** One busy member should not fill the whole list */
const LINES_PER_PERSON = 2;
const MOMENTS_READ = 30;

async function collect(): Promise<RawItem[]> {
  const items: RawItem[] = [];

  // Meetups: open, approved community events only, so every line leads somewhere a member can still go
  const events = (await db.listAllEvents()).filter(
    (e) => e.eventType === 'community' && (e.approvalStatus ?? 'approved') === 'approved' && !isEventEnded(e)
  );
  const participants = await db.listParticipantsByEvent(events.map((e) => e.id));
  for (const event of events) {
    for (const p of participants.get(event.id) ?? []) {
      if (!p.joinedAt) continue;
      items.push({
        id: `ev:${event.id}:${p.userId}`,
        kind: p.note === 'host' ? 'meetup_host' : 'meetup_join',
        at: p.joinedAt,
        memberId: p.userId,
        fallback: { name: p.userName, avatar: p.userAvatar },
        target: { type: 'community', id: event.id, title: event.title },
      });
    }
  }

  const quests = new Map((await db.findQuests({ page: 1, limit: 500 })).items.map((q) => [q.id, q.title]));
  for (const join of allQuestJoins()) {
    const title = quests.get(join.questId);
    if (!title) continue;
    items.push({ id: `qj:${join.questId}:${join.memberId}`, kind: 'quest_join', at: join.joinedAt, memberId: join.memberId, fallback: { name: '' }, target: { type: 'challenge', id: join.questId, title } });
  }
  for (const finish of allQuestFinishes()) {
    const title = quests.get(finish.questId);
    if (!title) continue;
    items.push({ id: `qf:${finish.questId}:${finish.memberId}`, kind: 'quest_finish', at: finish.finishedAt, memberId: finish.memberId, fallback: { name: '' }, target: { type: 'challenge', id: finish.questId, title } });
  }

  const { items: moments } = await momentRepository.query({ statuses: ['published'], sort: 'newest', page: 1, limit: MOMENTS_READ });
  const authors = await loadPeople(moments);
  for (const moment of moments) {
    if (!isPubliclyVisible(moment, authors)) continue;
    const type = moment.targetType === 'challenge' || moment.targetType === 'community' || moment.targetType === 'spot' || moment.targetType === 'fair' ? moment.targetType : 'general';
    items.push({
      id: `mo:${moment.id}`,
      kind: 'moment',
      at: moment.createdAt,
      memberId: moment.authorId,
      fallback: { name: moment.authorName, avatar: moment.authorAvatar },
      target: { type, id: type === 'general' ? moment.id : moment.targetId, title: moment.targetTitle || moment.location },
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** The newest lines for a signed-in member: never their own, never people they blocked or banned members */
export async function recentActivity(viewer: Member, limit = 12): Promise<LiveItem[]> {
  const blocked = new Set(viewer.blockedIds ?? []);
  const people = new Map<string, Member | null>();
  const perPerson = new Map<string, number>();
  const result: LiveItem[] = [];
  const now = Date.now();

  for (const item of await collect()) {
    if (result.length >= limit) break;
    if (item.memberId && (item.memberId === viewer.id || blocked.has(item.memberId))) continue;
    let person = item.fallback;
    if (item.memberId) {
      if (!people.has(item.memberId)) people.set(item.memberId, await memberRepository.findById(item.memberId));
      const member = people.get(item.memberId);
      if (member && (member.status === 'banned' || member.blockedIds?.includes(viewer.id))) continue;
      if (member) person = { name: member.displayName, avatar: member.avatarUrl };
    }
    if (!person.name) continue;
    // By the name shown, so several accounts with one name do not read as one person repeating
    const who = tidyDisplayName(person.name);
    if ((perPerson.get(who) ?? 0) >= LINES_PER_PERSON) continue;
    perPerson.set(who, (perPerson.get(who) ?? 0) + 1);
    result.push({ id: item.id, kind: item.kind, at: item.at, timeAgo: thaiTimeAgo(item.at, now), person: { name: tidyDisplayName(person.name), avatar: person.avatar }, target: item.target });
  }
  return result;
}

/** Counts are the same for every visitor, so one read serves them all for a minute (like the API's s-maxage) */
const COUNTS_TTL_MS = 60_000;
let cachedCounts: { at: number; value: Promise<LiveCounts> } | null = null;

/** Counts for visitors: how much happened in the last week, with no names */
export function activityCounts(): Promise<LiveCounts> {
  if (cachedCounts && Date.now() - cachedCounts.at < COUNTS_TTL_MS) return cachedCounts.value;
  const value = countActivity();
  cachedCounts = { at: Date.now(), value };
  value.catch(() => { cachedCounts = null; });
  return value;
}

async function countActivity(): Promise<LiveCounts> {
  const since = new Date(Date.now() - COUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const counts: LiveCounts = { since, meetupJoins: 0, questJoins: 0, moments: 0 };
  for (const item of await collect()) {
    if (item.at < since) break;
    if (item.kind === 'meetup_join') counts.meetupJoins++;
    else if (item.kind === 'quest_join') counts.questJoins++;
    else if (item.kind === 'moment') counts.moments++;
  }
  return counts;
}
