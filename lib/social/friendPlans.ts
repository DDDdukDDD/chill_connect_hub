import { db } from '../db';
import { parseEventDateToTimestamp, parseEventEndDateToTimestamp, isEventEnded } from '../dateUtils';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import { setFollowing } from '../members/safety';
import type { Member } from '../members/types';
import { tidyDisplayName } from '../displayName';
import type { Moment } from '../moments/types';
import { setSaved, taggableFriends, visibleMoment } from '../moments/service';
import { sendChatMessage } from './chat';
import { friendPlanStore, type FriendPlan, type PlanTargetType } from './friendPlanStore';
import { planToken, readInviteToken, teeToken } from './inviteLinks';
import { notifyInvite, notifyInviteYes, notifyPlan } from './notifications';
import { joinQuest } from './questJoins';
import { bangkokDay } from './questPlan';
import { INVITE_MAX_FRIENDS, PLAN_TOGETHER_POINTS } from './socialRules';
import { shortLabelOf } from './recurring';
import type { Visit } from './visits';

/**
 * "ชวนไป" everywhere, as group plans (owner 2026-11-10; every section and groups 2026-11-11).
 * A member invites friends (people who follow each other) to a place, an อีเวนต์, a challenge or a post, in the app or
 * through a LINE link. That makes one plan with them as host; everyone who answers "ไปกัน" joins it and its one group
 * chat, where the day is set. A ตี้ is different: it already has a day, seats and a chat, so its invitation only says
 * who asked and the friend signs up as usual (owner 2026-11-11).
 * The hourly job reminds the group the day before and asks how it went the day after. A member who posts at the place
 * after the plan was made, while someone else in it has too, earns PLAN_TOGETHER_POINTS once per plan, counted only
 * once their own post is proven (lib/social/questProgress.ts), like every XP.
 */

export { PLAN_TOGETHER_POINTS };
/** Friends a plan holds besides the host */
export const PLAN_MAX_GUESTS = INVITE_MAX_FRIENDS;
/** How far ahead a date may be set */
const MAX_DAYS_AHEAD = 365;
/** The "how did it go" question waits at most this many days after the date */
const FOLLOW_UP_DAYS = 7;

export type InviteTargetType = 'spot' | 'fair' | 'community' | 'quest' | 'moment';
const VISIT_TYPES = new Set<PlanTargetType>(['spot', 'community', 'fair']);
const TARGET_PATHS: Record<Exclude<PlanTargetType, 'general'>, string> = { spot: '/spots', community: '/community', fair: '/events', quest: '/challenges' };
const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const planPath = (plan: Pick<FriendPlan, 'id'>) => `/myhub?plan=${encodeURIComponent(plan.id)}`;
export const planRoomId = (planId: string) => `plan~${planId}`;
export const planIdOfRoom = (roomId: string) => (roomId.startsWith('plan~') ? roomId.slice(5) : null);
const nameOf = (member: Member) => tidyDisplayName(member.displayName).trim() || member.displayName;
const going = (plan: FriendPlan) => plan.members.filter((m) => m.state === 'going');
const memberOf = (plan: FriendPlan, memberId: string) => plan.members.find((m) => m.memberId === memberId);

/** The page of what the plan is for, or the post when it has no page */
function targetHref(plan: Pick<FriendPlan, 'targetType' | 'targetId' | 'momentId'>): string | undefined {
  if (plan.targetType !== 'general' && plan.targetId) return `${TARGET_PATHS[plan.targetType]}/${encodeURIComponent(plan.targetId)}`;
  return plan.momentId ? `/moments/${encodeURIComponent(plan.momentId)}` : undefined;
}

/** The posting form tied to the place, with a friend already tagged (HomeMomentFeed reads ?share=&with=) */
function postHref(plan: FriendPlan, friend?: { id: string; name: string }): string {
  const params = new URLSearchParams({ title: plan.title, location: plan.title, ...(friend ? { with: friend.id, withName: friend.name } : {}) });
  const share = VISIT_TYPES.has(plan.targetType) && plan.targetId ? `${plan.targetType}:${plan.targetId}` : 'general:';
  return `/?share=${encodeURIComponent(share)}&${params.toString()}`;
}

/** What an invitation is for, checked on the server: it must exist and be open */
interface InviteTarget {
  type: PlanTargetType;
  targetId?: string;
  momentId?: string;
  title: string;
  image?: string;
  /** The page the invitation opens */
  path: string;
  /** For the notice: the post, the ตี้/อีเวนต์ or the challenge it is about */
  refs: { momentId?: string; eventId?: string; questId?: string };
}

async function targetOf(type: unknown, id: unknown): Promise<InviteTarget> {
  const ref = typeof id === 'string' ? id.trim().slice(0, 200) : '';
  const gone = () => new MemberAuthError('ไม่พบรายการนี้แล้ว', 404);
  if (!ref) throw gone();
  if (type === 'spot') {
    const spot = await db.findSpotById(ref);
    if (!spot || spot.publicationStatus === 'draft') throw gone();
    return { type: 'spot', targetId: spot.id, title: spot.title, image: spot.image, path: `/spots/${encodeURIComponent(spot.id)}`, refs: {} };
  }
  if (type === 'fair' || type === 'community') {
    const event = await db.findEventById(ref);
    const isTee = event?.eventType === 'community';
    if (!event || (type === 'community') !== isTee || (event as { isPublished?: boolean }).isPublished === false) throw gone();
    if (isEventEnded(event)) throw new MemberAuthError(isTee ? 'ตี้นี้จบไปแล้ว' : 'อีเวนต์นี้จบไปแล้ว', 409);
    return { type: isTee ? 'community' : 'fair', targetId: event.id, title: event.title, image: event.image, path: `${isTee ? '/community' : '/events'}/${encodeURIComponent(event.id)}`, refs: { eventId: event.id } };
  }
  if (type === 'quest') {
    const quest = await db.findQuestById(ref);
    if (!quest || quest.status === 'draft') throw gone();
    if (quest.status === 'ended') throw new MemberAuthError('ชาเลนจ์นี้จบไปแล้ว', 409);
    return { type: 'quest', targetId: quest.id, title: quest.title, image: quest.image || quest.badgeCoverImg, path: `/challenges/${encodeURIComponent(quest.id)}`, refs: { questId: quest.id } };
  }
  if (type === 'moment') {
    const moment = await visibleMoment(ref);
    const placeType = VISIT_TYPES.has(moment.targetType as PlanTargetType) && moment.targetId ? (moment.targetType as PlanTargetType) : 'general';
    return {
      type: placeType,
      targetId: placeType === 'general' ? undefined : moment.targetId,
      momentId: moment.id,
      title: (moment.targetTitle || moment.location || 'ที่ในโพสต์นี้').slice(0, 200),
      image: moment.images[0],
      path: `/moments/${encodeURIComponent(moment.id)}`,
      refs: { momentId: moment.id },
      ...(moment.sharesOff ? { sharesOff: moment.authorId } : {}),
    } as InviteTarget;
  }
  throw gone();
}

const withToken = (path: string, token: string) => `${path}${path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(token)}`;

/** The host's plan for this target that is still ahead (or undated), or a new one */
async function hostPlanFor(member: Member, target: InviteTarget): Promise<FriendPlan> {
  const today = bangkokDay();
  const open = (await friendPlanStore.openOfHost(member.id, target.type, target.targetId, target.momentId)).find((p) => !p.date || p.date >= today);
  return open ?? friendPlanStore.create({ hostId: member.id, targetType: target.type, targetId: target.targetId, momentId: target.momentId, title: target.title, image: target.image });
}

/**
 * Sends "ชวนไป": friends picked in the app get a notice, and the link is returned for LINE. Both open the same page
 * with the same signed invitation. Returns how many were newly asked.
 */
export async function sendInvites(member: Member, input: { type?: unknown; id?: unknown; to?: unknown }): Promise<{ invited: number; link: string; planId?: string }> {
  const target = await targetOf(input.type, input.id);
  const sharesOff = (target as InviteTarget & { sharesOff?: string }).sharesOff;
  if (sharesOff && sharesOff !== member.id) throw new MemberAuthError('เจ้าของโพสต์ปิดการแชร์ไว้', 403);
  const asked = new Set(Array.isArray(input.to) ? input.to.filter((x): x is string => typeof x === 'string') : []);
  const friends = asked.size ? (await taggableFriends(member)).filter((f) => asked.has(f.id)) : [];

  // A ตี้: no plan, the notice and the link say who asked; the friend signs up as usual
  if (target.type === 'community' && !target.momentId) {
    const link = withToken(target.path, teeToken(target.targetId!, member.id));
    const chosen = friends.slice(0, PLAN_MAX_GUESTS);
    await Promise.all(chosen.map((f) => notifyInvite(f.id, member, { place: target.title, path: link, refs: target.refs })));
    return { invited: chosen.length, link };
  }

  const plan = await hostPlanFor(member, target);
  const inPlan = new Set(plan.members.map((m) => m.memberId));
  const room = PLAN_MAX_GUESTS - (plan.members.length - 1);
  const fresh = friends.filter((f) => !inPlan.has(f.id));
  if (asked.size && fresh.length > room) throw new MemberAuthError(room > 0 ? `แผนนี้ชวนเพิ่มได้อีก ${room} คน` : `แผนนี้มีเพื่อนครบ ${PLAN_MAX_GUESTS} คนแล้ว`, 409);
  await friendPlanStore.setMembers(plan.id, fresh.map((f) => f.id), 'invited');
  const link = withToken(target.path, planToken(plan.id));
  await Promise.all(fresh.map((f) => notifyInvite(f.id, member, { place: target.title, path: link, refs: target.refs })));
  return { invited: fresh.length, link, planId: plan.id };
}

export interface InviteInfo {
  kind: 'plan' | 'tee';
  host: { id: string; name: string; avatar: string };
  title: string;
  /** Who said "ไปกัน" so far, the host first (at most 5 shown) */
  going: { id: string; name: string; avatar: string }[];
  goingCount: number;
  /** The reader is already going */
  isIn: boolean;
  planId?: string;
}

async function activeHost(hostId: string, reader: Member | null): Promise<Member | null> {
  const host = await memberRepository.findById(hostId);
  if (!host || host.status !== 'active') return null;
  if (reader && (host.blockedIds?.includes(reader.id) || reader.blockedIds?.includes(hostId))) return null;
  return host;
}

/** What the banner on a page says about the invitation in its link; null when the link is not (or no longer) real */
export async function inviteInfo(reader: Member | null, token: unknown): Promise<InviteInfo | null> {
  const read = readInviteToken(token);
  if (!read) return null;
  const person = (m: Member) => ({ id: m.id, name: nameOf(m), avatar: m.avatarUrl ?? '' });
  if (read.kind === 'tee') {
    const [host, event] = await Promise.all([activeHost(read.inviterId, reader), db.findEventById(read.eventId)]);
    if (!host || !event) return null;
    return { kind: 'tee', host: person(host), title: event.title, going: [person(host)], goingCount: 1, isIn: false };
  }
  const plan = await friendPlanStore.byId(read.planId);
  if (!plan || plan.status === 'cancelled') return null;
  const host = await activeHost(plan.hostId, reader);
  if (!host) return null;
  const people = going(plan);
  const shown = await memberRepository.findByIds(people.slice(0, 5).map((m) => m.memberId));
  return {
    kind: 'plan',
    host: person(host),
    title: plan.title,
    going: people.slice(0, 5).flatMap((m) => (shown.get(m.memberId)?.status === 'active' ? [person(shown.get(m.memberId)!)] : [])),
    goingCount: people.length,
    isIn: Boolean(reader && memberOf(plan, reader.id)?.state === 'going'),
    planId: plan.id,
  };
}

/** A line in the plan's chat, so everyone sees what changed; the plan is saved even when the chat refuses */
const tellChat = (member: Member, plan: FriendPlan, text: string) => sendChatMessage(member, planRoomId(plan.id), text).catch(() => null);

/**
 * "ไปกัน" on an invitation: the member joins the plan (a challenge is joined too, a post is saved). Someone who came
 * through a LINE link, not asked in the app, follows the host so the host's posts are in their feed from the start.
 */
export async function answerInvite(member: Member, answer: { token?: unknown; planId?: unknown }): Promise<FriendPlan> {
  // A link carries its signed plan; from My Hub, a plan the member was asked to in the app
  const read = answer.token !== undefined ? readInviteToken(answer.token) : null;
  const planId = read?.kind === 'plan' ? read.planId : typeof answer.planId === 'string' ? answer.planId : '';
  const plan = planId ? await friendPlanStore.byId(planId) : null;
  if (plan && !read && memberOf(plan, member.id)?.state !== 'invited') throw new MemberAuthError('ไม่พบคำชวนนี้แล้ว', 404);
  if (!plan || plan.status === 'cancelled' || plan.hostId === member.id) throw new MemberAuthError('ไม่พบคำชวนนี้แล้ว', 404);
  const host = await activeHost(plan.hostId, member);
  if (!host) throw new MemberAuthError('ไม่พบคำชวนนี้แล้ว', 404);
  const held = memberOf(plan, member.id);
  if (held?.state === 'going') return plan;
  if (!held && plan.members.length - 1 >= PLAN_MAX_GUESTS) throw new MemberAuthError(`แผนนี้มีเพื่อนครบ ${PLAN_MAX_GUESTS} คนแล้ว`, 409);
  if (plan.targetType === 'quest' && plan.targetId) await joinQuest(member.id, plan.targetId);
  await friendPlanStore.setMembers(plan.id, [member.id], 'going');
  if (!held && !member.followingIds?.includes(host.id)) await setFollowing(member, host.id, true).catch(() => null);
  if (plan.momentId) await setSaved(member, plan.momentId, true).catch(() => null);
  await notifyInviteYes(host.id, member, { place: plan.title, path: planPath(plan), momentId: plan.momentId });
  await tellChat(member, plan, plan.targetType === 'quest' ? 'ทำด้วยกันนะ!' : 'ไปด้วยนะ!');
  return (await friendPlanStore.byId(plan.id))!;
}

export interface PlanPerson {
  id: string;
  name: string;
  avatar: string;
  went: boolean;
}

export interface PlanView {
  id: string;
  kind: PlanTargetType;
  title: string;
  image?: string;
  placeHref?: string;
  /** "YYYY-MM-DD", or none while they are still talking */
  date?: string;
  dateLabel?: string;
  /** An อีเวนต์ plan can only pick the event's days */
  dateMin?: string;
  dateMax?: string;
  /** The day has passed */
  isPast: boolean;
  isHost: boolean;
  host: { id: string; name: string };
  /** Everyone going, the host first */
  people: PlanPerson[];
  /** Asked in the app, not answered yet */
  invitedCount: number;
  /** The reader was asked and has not answered */
  isInvited: boolean;
  roomId: string;
  wentByMe: boolean;
  /** Posting form at the place with a friend tagged */
  postHref: string;
  /** For "ชวนเพิ่ม": what the plan is for */
  invite: { type: InviteTargetType; id: string };
  spotsLeft: number;
}

/** An อีเวนต์'s days as Thai dates, for the date picker */
async function fairRange(plan: FriendPlan): Promise<{ min?: string; max?: string }> {
  if (plan.targetType !== 'fair' || !plan.targetId) return {};
  const event = await db.findEventById(plan.targetId);
  if (!event?.date) return {};
  const start = parseEventDateToTimestamp(event.date);
  const end = parseEventEndDateToTimestamp(event.endDate || event.date);
  return { ...(start ? { min: bangkokDay(new Date(start)) } : {}), ...(end ? { max: bangkokDay(new Date(end)) } : {}) };
}

async function viewsOf(member: Member, plans: FriendPlan[]): Promise<PlanView[]> {
  const people = await memberRepository.findByIds([...new Set(plans.flatMap((p) => p.members.map((m) => m.memberId)))]);
  const blocked = new Set(member.blockedIds ?? []);
  const today = bangkokDay();
  const views: PlanView[] = [];
  for (const plan of plans) {
    const host = people.get(plan.hostId);
    if (!host || host.status !== 'active' || blocked.has(host.id) || host.blockedIds?.includes(member.id)) continue;
    const shown = going(plan)
      .sort((a, b) => (a.memberId === plan.hostId ? -1 : b.memberId === plan.hostId ? 1 : a.joinedAt.localeCompare(b.joinedAt)))
      .flatMap((m): PlanPerson[] => {
        const p = people.get(m.memberId);
        return p && p.status === 'active' && !blocked.has(p.id) ? [{ id: p.id, name: nameOf(p), avatar: p.avatarUrl ?? '', went: Boolean(m.wentAt) }] : [];
      });
    const friend = shown.find((p) => p.id !== member.id);
    const range = await fairRange(plan);
    const mine = memberOf(plan, member.id);
    views.push({
      id: plan.id,
      kind: plan.targetType,
      title: plan.title,
      image: plan.image,
      placeHref: targetHref(plan),
      date: plan.date,
      dateLabel: plan.date ? shortLabelOf(plan.date) : undefined,
      ...(range.min ? { dateMin: range.min > today ? range.min : today } : {}),
      ...(range.max ? { dateMax: range.max } : {}),
      isPast: Boolean(plan.date && plan.date < today),
      isHost: plan.hostId === member.id,
      host: { id: host.id, name: nameOf(host) },
      people: shown,
      invitedCount: plan.members.filter((m) => m.state === 'invited').length,
      isInvited: mine?.state === 'invited',
      roomId: planRoomId(plan.id),
      wentByMe: Boolean(mine?.wentAt),
      postHref: postHref(plan, friend),
      invite: plan.targetType === 'general' || !plan.targetId ? { type: 'moment', id: plan.momentId ?? '' } : { type: plan.targetType, id: plan.targetId },
      spotsLeft: Math.max(0, PLAN_MAX_GUESTS - (plan.members.length - 1)),
    });
  }
  return views;
}

/** The member's plans for My Hub: dated ones first by day, then the ones still being talked over, then invitations */
export async function plansOf(member: Member): Promise<PlanView[]> {
  const views = await viewsOf(member, await friendPlanStore.ofMember(member.id));
  const rank = (v: PlanView) => (v.isInvited ? 2 : v.date ? 0 : 1);
  return views.sort((a, b) => rank(a) - rank(b) || (a.date && b.date ? a.date.localeCompare(b.date) : 0));
}

async function myPlan(member: Member, id: string): Promise<FriendPlan> {
  const plan = await friendPlanStore.byId(id);
  if (!plan || plan.status === 'cancelled' || memberOf(plan, member.id)?.state !== 'going') throw new MemberAuthError('ไม่พบแผนนี้แล้ว', 404);
  return plan;
}

/** Sets or clears the day, from the chat (owner 2026-11-10: the date is agreed in the chat) */
export async function setPlanDate(member: Member, id: string, date: unknown): Promise<PlanView> {
  const plan = await myPlan(member, id);
  if (date === null) {
    await friendPlanStore.update(plan.id, { date: null, status: 'planning', remindedAt: undefined, followedUpAt: undefined });
    await tellChat(member, plan, `ขอเลื่อนวันไป${plan.title}ก่อน ค่อยนัดกันใหม่นะ`);
  } else {
    const today = bangkokDay();
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new MemberAuthError('เลือกวันอีกทีนะ');
    if (date < today) throw new MemberAuthError('เลือกวันนี้หรือวันหลังจากนี้นะ');
    if (date > addDays(today, MAX_DAYS_AHEAD)) throw new MemberAuthError('นัดล่วงหน้าได้ไม่เกิน 1 ปี');
    const range = await fairRange(plan);
    if ((range.min && date < range.min) || (range.max && date > range.max)) throw new MemberAuthError('เลือกวันที่อยู่ในช่วงงานนะ');
    await friendPlanStore.update(plan.id, { date, status: 'set', remindedAt: undefined, followedUpAt: undefined });
    await tellChat(member, plan, `นัดไป${plan.title} ${shortLabelOf(date)} นะ`);
  }
  const [view] = await viewsOf(member, [(await friendPlanStore.byId(plan.id))!]);
  if (!view) throw new MemberAuthError('ไม่พบแผนนี้แล้ว', 404);
  return view;
}

/** The host calls the plan off for everyone; anyone else leaves it (an invitation not answered is turned down) */
export async function leavePlan(member: Member, id: string): Promise<'cancelled' | 'left'> {
  const plan = await friendPlanStore.byId(id);
  const mine = plan && plan.status !== 'cancelled' ? memberOf(plan, member.id) : undefined;
  if (!plan || !mine) throw new MemberAuthError('ไม่พบแผนนี้แล้ว', 404);
  if (plan.hostId === member.id) {
    await tellChat(member, plan, `ยกเลิกแผนไป${plan.title}แล้ว ไว้ชวนกันใหม่นะ`);
    await friendPlanStore.update(plan.id, { status: 'cancelled' });
    return 'cancelled';
  }
  if (mine.state === 'going') await tellChat(member, plan, 'รอบนี้ขอไม่ไปก่อนนะ ไว้ชวนกันใหม่');
  await friendPlanStore.removeMember(plan.id, member.id);
  return 'left';
}

/**
 * A moment posted at a place: marks the member as having been, on every open plan there made before now. When someone
 * else in the plan has been too, the member hears it, and so does whoever had been alone there until now (once each).
 * Whether it earns XP is decided by planPoints, from proven visits.
 */
export async function notePlanVisit(member: Member, moment: Pick<Moment, 'targetType' | 'targetId' | 'createdAt'>): Promise<void> {
  if (!VISIT_TYPES.has(moment.targetType as PlanTargetType) || !moment.targetId) return;
  const plans = (await friendPlanStore.ofMember(member.id)).filter((p) => {
    const mine = memberOf(p, member.id);
    return p.targetType === moment.targetType && p.targetId === moment.targetId && p.createdAt <= moment.createdAt && mine?.state === 'going' && !mine.wentAt;
  });
  for (const plan of plans) {
    await friendPlanStore.markWent(plan.id, member.id, moment.createdAt);
    const others = going(plan).filter((m) => m.memberId !== member.id && m.wentAt);
    if (others.length === 0) continue;
    const path = planPath(plan);
    await notifyPlan('plan_together', member.id, others[0].memberId, path, plan.title);
    if (others.length === 1) await notifyPlan('plan_together', others[0].memberId, member.id, path, plan.title);
  }
}

/**
 * The "ไปกับเพื่อน" bonus for progress (lib/social/questProgress.ts): each plan where the member and at least one other
 * person have been, counted when the member's own visit there is proven (not a photo still waiting for staff) and the
 * place still exists.
 * A failed read counts 0 (logged): every XP total runs through here, so a missing table (plan migration not yet run on
 * live) must not take the rewards, challenges and Home down with it.
 */
export async function planPoints(memberId: string, visits: Visit[], placeExists: (visit: Visit) => boolean): Promise<number> {
  let all: Awaited<ReturnType<typeof friendPlanStore.ofMember>>;
  try {
    all = await friendPlanStore.ofMember(memberId);
  } catch (error) {
    console.error('planPoints: friend plans could not be read, counting 0', error);
    return 0;
  }
  const plans = all.filter((p) => p.targetId && memberOf(p, memberId)?.wentAt && going(p).some((m) => m.memberId !== memberId && m.wentAt));
  if (plans.length === 0) return 0;
  return plans.reduce((sum, plan) => {
    const visit = visits.find((v) => v.targetType === plan.targetType && v.targetId === plan.targetId);
    return sum + (visit && !visit.pending && visit.evidence !== 'marked' && placeExists(visit) ? PLAN_TOGETHER_POINTS : 0);
  }, 0);
}

/**
 * The hourly job (app/api/cron/hourly): the day before, everyone going is reminded; the day after (up to a week),
 * whoever has not posted there yet is asked how it went, with the posting form one tap away. Each happens once per date.
 */
export async function runPlanReminders(): Promise<{ reminded: number; followedUp: number }> {
  const today = bangkokDay();
  const tomorrow = addDays(today, 1);
  const plans = await friendPlanStore.dated(addDays(today, -FOLLOW_UP_DAYS), tomorrow);
  let reminded = 0;
  let followedUp = 0;
  for (const plan of plans) {
    const people = going(plan);
    if (people.length < 2) continue;
    // The notice names someone else in the plan: the host, or for the host the first friend who said yes
    const someoneElse = (id: string) => (id === plan.hostId ? people.find((m) => m.memberId !== id)!.memberId : plan.hostId);
    if (plan.date === tomorrow && !plan.remindedAt) {
      await friendPlanStore.update(plan.id, { remindedAt: new Date().toISOString() });
      await Promise.all(people.map((m) => notifyPlan('plan_soon', m.memberId, someoneElse(m.memberId), planPath(plan), plan.title)));
      reminded += 1;
    } else if (plan.date! < today && !plan.followedUpAt) {
      await friendPlanStore.update(plan.id, { followedUpAt: new Date().toISOString() });
      if (plan.targetType !== 'quest') {
        const found = await memberRepository.findByIds(people.map((m) => m.memberId));
        for (const m of people.filter((p) => !p.wentAt)) {
          const friend = found.get(someoneElse(m.memberId));
          if (!friend) continue;
          await notifyPlan('plan_after', m.memberId, friend.id, postHref(plan, { id: friend.id, name: nameOf(friend) }), plan.title);
        }
      }
      followedUp += 1;
    }
  }
  return { reminded, followedUp };
}

export const removePlansBy = (memberId: string) => friendPlanStore.removeBy(memberId);
