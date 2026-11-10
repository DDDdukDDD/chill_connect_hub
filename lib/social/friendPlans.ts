import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { tidyDisplayName } from '../displayName';
import type { Moment } from '../moments/types';
import { setSaved } from '../moments/service';
import { sendChatMessage } from './chat';
import { friendPlanStore, type FriendPlan, type PlanTargetType } from './friendPlanStore';
import { pairRoomId } from './meetAgain';
import { notifyPlan } from './notifications';
import { bangkokDay } from './questPlan';
import { PLAN_TOGETHER_POINTS } from './socialRules';
import { shortLabelOf } from './recurring';
import type { Visit } from './visits';

/**
 * "ไปกัน" plans (owner 2026-11-10). A friend who answers "ไปกัน" on a post they were invited to makes a plan with the
 * one who asked: the post is saved for both, their two-person chat opens with the plan on top, and the date is set
 * there. The hourly job reminds them the day before and asks how it went the day after. When both have posted a
 * moment at the place after the plan was made, each earns PLAN_TOGETHER_POINTS, counted only once their own post is
 * proven (lib/social/questProgress.ts), like every XP.
 */

export { PLAN_TOGETHER_POINTS };
/** How far ahead a date may be set */
const MAX_DAYS_AHEAD = 365;
/** The "how did it go" question waits at most this many days after the date */
const FOLLOW_UP_DAYS = 7;

const VISIT_TYPES = new Set<PlanTargetType>(['spot', 'community', 'fair']);
const PLACE_PATHS: Record<Exclude<PlanTargetType, 'general'>, string> = { spot: '/spots', community: '/community', fair: '/events' };
const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const planPath = (plan: Pick<FriendPlan, 'id'>) => `/myhub?plan=${encodeURIComponent(plan.id)}`;
const nameOf = (member: Member) => tidyDisplayName(member.displayName).trim() || member.displayName;
const otherOf = (plan: FriendPlan, memberId: string) => (plan.inviterId === memberId ? plan.friendId : plan.inviterId);
const wentOf = (plan: FriendPlan, memberId: string) => (plan.inviterId === memberId ? plan.inviterWentAt : plan.friendWentAt);

/** The page about the place itself, or the post when the place has no page */
function placeHref(plan: FriendPlan): string | undefined {
  if (plan.targetType !== 'general' && plan.targetId) return `${PLACE_PATHS[plan.targetType]}/${encodeURIComponent(plan.targetId)}`;
  return plan.momentId ? `/moments/${encodeURIComponent(plan.momentId)}` : undefined;
}

/** The posting form tied to the place, with the friend already tagged (HomeMomentFeed reads ?share=&with=) */
function postHref(plan: FriendPlan, friend: { id: string; name: string }): string {
  const params = new URLSearchParams({ title: plan.title, location: plan.title, with: friend.id, withName: friend.name });
  const share = plan.targetType !== 'general' && plan.targetId ? `${plan.targetType}:${plan.targetId}` : 'general:';
  return `/?share=${encodeURIComponent(share)}&${params.toString()}`;
}

/** The friend answered "ไปกัน": the plan for this post and pair (made once), and the post saved for both */
export async function startPlan(friend: Member, inviterId: string, moment: Moment): Promise<FriendPlan> {
  const targetType: PlanTargetType = VISIT_TYPES.has(moment.targetType as PlanTargetType) && moment.targetId ? (moment.targetType as PlanTargetType) : 'general';
  const plan = await friendPlanStore.findOrCreate({
    momentId: moment.id,
    targetType,
    targetId: targetType === 'general' ? undefined : moment.targetId,
    title: (moment.targetTitle || moment.location || 'ที่ในโพสต์นี้').slice(0, 200),
    image: moment.images[0],
    inviterId,
    friendId: friend.id,
  });
  const inviter = await memberRepository.findById(inviterId);
  await Promise.all([setSaved(friend, moment.id, true), inviter ? setSaved(inviter, moment.id, true) : null].map((p) => p?.catch(() => null)));
  return plan;
}

export interface PlanView {
  id: string;
  title: string;
  image?: string;
  placeHref?: string;
  /** "YYYY-MM-DD", or none while they are still talking */
  date?: string;
  dateLabel?: string;
  /** The day has passed */
  isPast: boolean;
  friend: { id: string; name: string; avatar: string };
  roomId: string;
  wentByMe: boolean;
  wentByFriend: boolean;
  /** Posting form at the place with the friend tagged */
  postHref: string;
}

async function viewsOf(member: Member, plans: FriendPlan[]): Promise<PlanView[]> {
  const others = await memberRepository.findByIds(plans.map((p) => otherOf(p, member.id)));
  const blocked = new Set(member.blockedIds ?? []);
  const today = bangkokDay();
  return plans.flatMap((plan) => {
    const other = others.get(otherOf(plan, member.id));
    if (!other || other.status !== 'active' || blocked.has(other.id) || other.blockedIds?.includes(member.id)) return [];
    const friend = { id: other.id, name: nameOf(other), avatar: other.avatarUrl ?? '' };
    return [{
      id: plan.id,
      title: plan.title,
      image: plan.image,
      placeHref: placeHref(plan),
      date: plan.date,
      dateLabel: plan.date ? shortLabelOf(plan.date) : undefined,
      isPast: Boolean(plan.date && plan.date < today),
      friend,
      roomId: pairRoomId(member.id, other.id),
      wentByMe: Boolean(wentOf(plan, member.id)),
      wentByFriend: Boolean(wentOf(plan, other.id)),
      postHref: postHref(plan, friend),
    }];
  });
}

/** The member's plans for My Hub: dated ones first by day, then the ones still being talked over */
export async function plansOf(member: Member): Promise<PlanView[]> {
  const views = await viewsOf(member, await friendPlanStore.ofMember(member.id));
  return views.sort((a, b) => (a.date && b.date ? a.date.localeCompare(b.date) : a.date ? -1 : b.date ? 1 : 0));
}

async function myPlan(member: Member, id: string): Promise<FriendPlan> {
  const plan = await friendPlanStore.byId(id);
  if (!plan || plan.status === 'cancelled' || (plan.inviterId !== member.id && plan.friendId !== member.id)) throw new MemberAuthError('ไม่พบแผนนี้แล้ว', 404);
  return plan;
}

/** A line in their chat, so both see what changed; the plan is saved even when the chat refuses (new account rules) */
const tellChat = (member: Member, plan: FriendPlan, text: string) => sendChatMessage(member, pairRoomId(plan.inviterId, plan.friendId), text).catch(() => null);

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
    await friendPlanStore.update(plan.id, { date, status: 'set', remindedAt: undefined, followedUpAt: undefined });
    await tellChat(member, plan, `นัดไป${plan.title} ${shortLabelOf(date)} นะ`);
  }
  const [view] = await viewsOf(member, [(await friendPlanStore.byId(plan.id))!]);
  if (!view) throw new MemberAuthError('ไม่พบแผนนี้แล้ว', 404);
  return view;
}

export async function cancelPlan(member: Member, id: string): Promise<void> {
  const plan = await myPlan(member, id);
  await friendPlanStore.update(plan.id, { status: 'cancelled' });
  await tellChat(member, plan, `ยกเลิกแผนไป${plan.title}แล้ว ไว้ชวนกันใหม่นะ`);
}

/**
 * A moment posted at a place: marks the member as having been, on every open plan there made before now. When the
 * other one has been too, both hear it (once). Whether it earns XP is decided by planPoints, from proven visits.
 */
export async function notePlanVisit(member: Member, moment: Pick<Moment, 'targetType' | 'targetId' | 'createdAt'>): Promise<void> {
  if (!VISIT_TYPES.has(moment.targetType as PlanTargetType) || !moment.targetId) return;
  const plans = (await friendPlanStore.ofMember(member.id)).filter((p) => p.targetType === moment.targetType && p.targetId === moment.targetId && p.createdAt <= moment.createdAt && !wentOf(p, member.id));
  for (const plan of plans) {
    const isInviter = plan.inviterId === member.id;
    await friendPlanStore.update(plan.id, isInviter ? { inviterWentAt: moment.createdAt } : { friendWentAt: moment.createdAt });
    const otherId = otherOf(plan, member.id);
    if (!wentOf(plan, otherId)) continue;
    await Promise.all([notifyPlan('plan_together', member.id, otherId, planPath(plan), plan.title), notifyPlan('plan_together', otherId, member.id, planPath(plan), plan.title)]);
  }
}

/**
 * The "ไปกับเพื่อน" bonus for progress (lib/social/questProgress.ts): each plan where both have been, counted when the
 * member's own visit there is proven (not a photo still waiting for staff) and the place still exists.
 */
export async function planPoints(memberId: string, visits: Visit[], placeExists: (visit: Visit) => boolean): Promise<number> {
  const plans = (await friendPlanStore.ofMember(memberId)).filter((p) => p.inviterWentAt && p.friendWentAt && p.targetId);
  if (plans.length === 0) return 0;
  return plans.reduce((sum, plan) => {
    const visit = visits.find((v) => v.targetType === plan.targetType && v.targetId === plan.targetId);
    return sum + (visit && !visit.pending && visit.evidence !== 'marked' && placeExists(visit) ? PLAN_TOGETHER_POINTS : 0);
  }, 0);
}

/**
 * The hourly job (app/api/cron/hourly): the day before, both are reminded; the day after (up to a week), whoever has
 * not posted there yet is asked how it went, with the posting form one tap away. Each happens once per date.
 */
export async function runPlanReminders(): Promise<{ reminded: number; followedUp: number }> {
  const today = bangkokDay();
  const tomorrow = addDays(today, 1);
  const plans = await friendPlanStore.dated(addDays(today, -FOLLOW_UP_DAYS), tomorrow);
  let reminded = 0;
  let followedUp = 0;
  for (const plan of plans) {
    const pair = [plan.inviterId, plan.friendId] as const;
    if (plan.date === tomorrow && !plan.remindedAt) {
      await friendPlanStore.update(plan.id, { remindedAt: new Date().toISOString() });
      await Promise.all(pair.map((id) => notifyPlan('plan_soon', id, otherOf(plan, id), planPath(plan), plan.title)));
      reminded += 1;
    } else if (plan.date! < today && !plan.followedUpAt) {
      await friendPlanStore.update(plan.id, { followedUpAt: new Date().toISOString() });
      const people = await memberRepository.findByIds([...pair]);
      for (const id of pair.filter((who) => !wentOf(plan, who))) {
        const friend = people.get(otherOf(plan, id));
        if (!friend) continue;
        await notifyPlan('plan_after', id, friend.id, postHref(plan, { id: friend.id, name: nameOf(friend) }), plan.title);
      }
      followedUp += 1;
    }
  }
  return { reminded, followedUp };
}

export const removePlansBy = (memberId: string) => friendPlanStore.removeBy(memberId);
