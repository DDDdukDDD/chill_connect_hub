import { db } from '../db';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { tidyDisplayName } from '../displayName';
import { taggableFriends, visibleMoment } from '../moments/service';
import { questMemberStore } from './stores';
import { joinQuest } from './questJoins';
import { circleItems, findQuest, questPicture, type ChallengeCircle, type ChallengeCircleDetail } from './circles';
import { inviteSheetInfo, sendInvites } from './friendPlans';
import { traceAction } from './actionLog';
import { notifyCheer, notifyFollowAlong } from './notifications';
import { notificationStore } from './notificationStore';
import { progressOf } from './questProgress';
import { questActionLink } from '../questDisplay';
import type { ChallengeQuest } from '@/data/mockData';

/**
 * What opening a Circle offers (Circles round A, owner 2026-11-16): see a friend doing a challenge, then do it too.
 * A Circle's id says what it is (lib/social/circles.ts): `f:<questId>:<memberId>` a finish, `s:<momentId>` a step
 * posted with a challenge line (a finish when it is the last step), `d:<questId>:<memberId>` the reader's own challenge.
 * Every action goes through what already exists: joining a challenge, the "ไปกัน" invitation and its plan chat.
 */

/** A name without its bracket ("คุณเบส (Best_Gamer)" → "คุณเบส"), as the Circle row shows it */
export const shortName = (name: string) => name.replace(/\s*\(.*$/, '') || name;

/** Friends named by the "who is doing it" line, before "และเพื่อนอีก N คน" */
const FRIENDS_NAMED = 3;

export interface FriendsDoing {
  /** Up to FRIENDS_NAMED friends doing it: mutual follows first, then people the reader follows */
  friends: { id: string; name: string; avatar?: string }[];
  /** All friends doing it, the named ones included */
  friendCount: number;
  /** Everyone doing it (a sample challenge's starting count included, as its page shows) */
  total: number;
}

/**
 * "คุณแนน คุณวิน และเพื่อนอีก 2 คนทำอยู่ · ทั้งหมด 1,000 คน" (owner 2026-11-16): friends are people the reader follows,
 * neither side blocking. Only the friends are read from the members table, so a challenge with many people stays cheap.
 */
export async function friendsDoing(reader: Member | null, questId: string, except: string[] = []): Promise<FriendsDoing | null> {
  const quest = await db.findQuestById(questId);
  if (!quest || quest.status === 'draft') return null;
  const joiners = (await questMemberStore.joins({ questId })).map((join) => join.memberId);
  const total = (quest.participantsCount ?? 0) + joiners.length;
  if (!reader) return { friends: [], friendCount: 0, total };
  const following = new Set(reader.followingIds ?? []);
  const skip = new Set([reader.id, ...except, ...(reader.blockedIds ?? [])]);
  const ids = joiners.filter((id) => following.has(id) && !skip.has(id));
  const people = [...(await memberRepository.findByIds(ids)).values()].filter((p) => p.status === 'active' && !p.blockedIds?.includes(reader.id));
  const rank = (p: Member) => (p.followingIds?.includes(reader.id) ? 0 : 1);
  people.sort((a, b) => rank(a) - rank(b));
  return {
    friends: people.slice(0, FRIENDS_NAMED).map((p) => ({ id: p.id, name: tidyDisplayName(p.displayName).trim() || p.displayName, ...(p.avatarUrl ? { avatar: p.avatarUrl } : {}) })),
    friendCount: people.length,
    total,
  };
}

export type CircleAction = 'together' | 'try' | 'invite' | 'cheer';

/**
 * The next thing to do on the reader's own Circle (owner 2026-11-18: sending a result took a detour through the challenge
 * page). 'post' opens the posting form tied to the challenge right on Home; 'link' goes where the step is done.
 */
export type CircleNextStep = { kind: 'post'; label: string; withPlace: boolean } | { kind: 'link'; label: string; href: string };

/** What a challenge asks for next, by how it counts (the same words its page uses) */
export function nextStepOf(quest: ChallengeQuest): CircleNextStep {
  const page = `/challenges/${encodeURIComponent(quest.id)}`;
  const rule = quest.rule;
  if (quest.plan) return { kind: 'link', label: 'บันทึกวันนี้', href: `${page}#plan` };
  if (!rule) return { kind: 'link', label: 'บันทึกความคืบหน้า', href: page };
  if (rule.posts) return { kind: 'post', label: 'โพสต์โมเมนต์', withPlace: Boolean(rule.posts.withPlace) };
  const action = questActionLink(rule);
  if (action) return { kind: 'link', ...action };
  if (rule.asHost) return { kind: 'link', label: 'ตั้งตี้ของฉัน', href: '/community?create=1' };
  const only = rule.targetTypes.length === 1 ? rule.targetTypes[0] : 'spot';
  return { kind: 'link', label: only === 'community' ? 'หาตี้ที่นับ' : only === 'fair' ? 'หาอีเวนต์ที่นับ' : 'หาที่ที่นับ', href: `${page}#places` };
}

/** Who cheered a Circle: one notice per person, keyed by the challenge and, for a posted step, the post */
const cheerMatch = (personId: string, questId: string, momentId?: string) => ({ memberId: personId, types: ['cheer' as const], questId, ...(momentId ? { momentId } : {}) });

export interface CircleDetail {
  id: string;
  kind: 'finish' | 'step' | 'doing';
  person: { id: string; name: string; avatar?: string };
  isMe: boolean;
  quest: { id: string; title: string; image?: string; open: boolean };
  current?: number;
  total?: number;
  /** The post's photo for a step; otherwise the challenge cover */
  image?: string;
  momentId?: string;
  /** The reader's own place in the challenge */
  joined: boolean;
  finished: boolean;
  /** Can the reader invite this person (they follow each other), and where that stands */
  canInvite: boolean;
  invite: 'none' | 'asked' | 'going';
  /** The main button: what this Circle asks the reader to do */
  cta: Exclude<CircleAction, 'cheer'> | 'share_invite' | 'open';
  doing: FriendsDoing | null;
  /** The reader's own Circle, not finished: the next step and how far they are (counted the same way as the challenge page) */
  next?: CircleNextStep;
  progress?: { current: number; total: number };
  /** A friend's step or finish can be cheered once (owner 2026-11-18); `cheered` says the reader already did */
  canCheer: boolean;
  cheered: boolean;
  /** On the reader's own step or finish: friends who cheered it, newest first, at most three named */
  cheers?: { count: number; people: { id: string; name: string; avatar?: string }[] };
}

interface Parsed {
  kind: 'finish' | 'step' | 'doing';
  questId: string;
  personId: string;
  current?: number;
  total?: number;
  momentId?: string;
  image?: string;
}

async function parse(id: string): Promise<Parsed> {
  const [tag, a, b] = id.split(':');
  if ((tag === 'f' || tag === 'd') && a && b) return { kind: tag === 'f' ? 'finish' : 'doing', questId: a, personId: b };
  if (tag === 's' && a) {
    const moment = await visibleMoment(a).catch(() => null);
    const line = moment?.achievement;
    if (!moment?.authorId || !line) throw new MemberAuthError('ไม่พบโพสต์นี้แล้ว', 404);
    return { kind: line.current >= line.total ? 'finish' : 'step', questId: line.questId, personId: moment.authorId, current: line.current, total: line.total, momentId: moment.id, image: moment.images?.[0] };
  }
  throw new MemberAuthError('ไม่พบ Circle นี้', 404);
}

export async function circleDetail(reader: Member, id: string): Promise<CircleDetail> {
  const parsed = await parse(id);
  if (parsed.kind === 'doing' && parsed.personId !== reader.id) throw new MemberAuthError('ไม่พบ Circle นี้', 404);
  const [quest, person, joins, finishes, friends] = await Promise.all([
    findQuest(parsed.questId),
    memberRepository.findById(parsed.personId),
    questMemberStore.joins({ memberId: reader.id }),
    questMemberStore.finishes({ memberId: reader.id }),
    taggableFriends(reader),
  ]);
  if (!quest || quest.status === 'draft' || !person || person.status !== 'active' || person.blockedIds?.includes(reader.id) || reader.blockedIds?.includes(person.id)) {
    throw new MemberAuthError('ไม่พบ Circle นี้', 404);
  }
  const isMe = person.id === reader.id;
  const open = quest.status !== 'ended';
  const joined = joins.some((j) => j.questId === quest.id);
  const finished = finishes.some((f) => f.questId === quest.id);
  const canInvite = !isMe && open && friends.some((f) => f.id === person.id);
  let invite: CircleDetail['invite'] = 'none';
  if (canInvite && joined) {
    const sheet = await inviteSheetInfo(reader, { type: 'quest', id: quest.id });
    const into = sheet.plans.find((p) => p.id === sheet.into);
    invite = into?.going?.includes(person.id) ? 'going' : into?.inPlan?.includes(person.id) ? 'asked' : 'none';
  }
  // The one thing to do: join them while they are on the way, take it up once they finished, ask them along when
  // the reader is already in it; on the reader's own Circle, ask friends along
  const cta: CircleDetail['cta'] = !open
    ? 'open'
    : isMe
      ? 'share_invite'
      : !joined && !finished
        ? parsed.kind === 'step' && canInvite ? 'together' : 'try'
        : canInvite && invite === 'none' && parsed.kind === 'step' ? 'invite' : 'open';
  // My own Circle on a challenge not finished: the next step, and how far I am (a doing Circle has no number of its own)
  const mineOpen = isMe && open && !finished;
  const progress = mineOpen ? (await progressOf(reader.id).catch(() => null))?.quests.find((q) => q.questId === quest.id) : undefined;
  const cheerKey = cheerMatch(person.id, quest.id, parsed.momentId);
  const canCheer = !isMe && parsed.kind !== 'doing';
  const [cheered, cheerers] = await Promise.all([
    canCheer ? notificationStore.exists({ ...cheerKey, actorId: reader.id }).catch(() => false) : false,
    isMe && parsed.kind !== 'doing' ? notificationStore.actorsOf(cheerKey).catch((): string[] => []) : ([] as string[]),
  ]);
  const cheerPeople = cheerers.length ? [...(await memberRepository.findByIds(cheerers.slice(0, 3))).values()].filter((p) => p.status === 'active') : [];
  const picture = questPicture(quest);
  return {
    id,
    kind: parsed.kind,
    person: { id: person.id, name: tidyDisplayName(person.displayName).trim() || person.displayName, ...(person.avatarUrl ? { avatar: person.avatarUrl } : {}) },
    isMe,
    quest: { id: quest.id, title: quest.title, ...(picture ? { image: picture } : {}), open },
    ...(parsed.current !== undefined ? { current: parsed.current, total: parsed.total } : {}),
    ...(parsed.image || picture ? { image: parsed.image || picture } : {}),
    ...(parsed.momentId ? { momentId: parsed.momentId } : {}),
    joined,
    finished,
    canInvite,
    invite,
    cta,
    doing: await friendsDoing(reader, quest.id, [person.id]),
    ...(mineOpen ? { next: nextStepOf(quest) } : {}),
    ...(progress && progress.total > 0 ? { progress: { current: progress.current, total: progress.total } } : {}),
    canCheer,
    cheered: Boolean(cheered),
    ...(isMe && parsed.kind !== 'doing'
      ? { cheers: { count: cheerers.length, people: cheerPeople.map((p) => ({ id: p.id, name: tidyDisplayName(p.displayName).trim() || p.displayName, ...(p.avatarUrl ? { avatar: p.avatarUrl } : {}) })) } }
      : {}),
  };
}

/**
 * The main button. 'together': join and invite this friend into a "ทำด้วยกัน" plan (they answer, as with any invitation).
 * 'try': join; the friend who finished is told "เริ่มทำตามคุณ". 'invite': the reader is in it already, ask the friend along.
 * Each join is logged with the Circle as its source and the friend credited.
 */
export async function circleAct(reader: Member, id: string, action: CircleAction): Promise<{ detail: CircleDetail; message: string }> {
  const before = await circleDetail(reader, id);
  // "ชื่นชม" (owner 2026-11-18): once per friend's step or finish, also after the challenge closed; the friend hears who
  if (action === 'cheer') {
    if (!before.canCheer) throw new MemberAuthError('ทำรายการนี้ไม่ได้', 400);
    if (!before.cheered) await notifyCheer(before.person.id, reader, before.quest, before.momentId);
    return { detail: { ...before, cheered: true }, message: `ส่งคำชื่นชมให้${shortName(before.person.name)}แล้ว` };
  }
  if (before.isMe || !before.quest.open) throw new MemberAuthError('ทำรายการนี้ไม่ได้', 400);
  const source = { type: 'circle' as const, ref: id, creditedId: before.person.id };
  const join = async () => {
    if (before.joined || before.finished) return;
    await joinQuest(reader.id, before.quest.id);
    await traceAction(reader, 'challenge_join', { type: 'challenge', ref: before.quest.id }, source);
  };
  const ask = async () => {
    if (!before.canInvite || before.invite !== 'none') return false;
    const sent = await sendInvites(reader, { type: 'quest', id: before.quest.id, to: [before.person.id] });
    return sent.invited > 0;
  };
  let message: string;
  if (action === 'together') {
    await join();
    message = (await ask()) ? `เข้าร่วมแล้ว และชวน${shortName(before.person.name)}ทำด้วยกันแล้ว` : 'เข้าร่วมชาเลนจ์แล้ว';
  } else if (action === 'try') {
    await join();
    if (before.kind === 'finish') await notifyFollowAlong(before.person.id, reader, before.quest);
    message = 'เข้าร่วมชาเลนจ์แล้ว ลุยกันเลย!';
  } else {
    message = (await ask()) ? `ชวน${shortName(before.person.name)}แล้ว` : `${shortName(before.person.name)}อยู่ในนัดนี้แล้ว`;
  }
  return { detail: await circleDetail(reader, id), message };
}

/**
 * A friends-on-one-challenge Circle opened (`c:<questId>`, Circles at scale 2026-11-18): the reader's place in the
 * challenge and which of these friends they already cheered. Who is in it comes from the reader's own Circles list, so
 * nobody shows here who would not show in the row. Cheering and joining go through each person's own Circle id.
 */
export async function challengeCircleDetail(reader: Member, id: string): Promise<ChallengeCircleDetail> {
  const questId = id.slice(2);
  const group = (await circleItems(reader)).find((item): item is ChallengeCircle => item.kind === 'challenge' && item.id === id);
  const quest = group ? await findQuest(questId) : null;
  if (!group || !quest) throw new MemberAuthError('ไม่พบ Circle นี้', 404);
  const [joins, finishes] = await Promise.all([questMemberStore.joins({ memberId: reader.id, questId: quest.id }), questMemberStore.finishes({ memberId: reader.id, questId: quest.id })]);
  const cheered = await Promise.all(
    group.people.map(async (person) => {
      const done = await notificationStore.exists({ ...cheerMatch(person.person.id, quest.id, person.momentId), actorId: reader.id }).catch(() => false);
      return done ? person.id : null;
    })
  );
  return { id, open: quest.status !== 'ended', joined: joins.length > 0, finished: finishes.length > 0, cheered: cheered.filter((c): c is string => c !== null) };
}
