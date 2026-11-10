import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { uuidV7 } from '../db/postgres/rows.mjs';
import { createJsonStore } from './jsonStore';

/**
 * Where "ไปกัน" plans are kept (db/migrations/0043_friend_plans.sql). The rules live in lib/social/friendPlans.ts; this
 * file only reads and writes. Member and moment ids are the app's own ids, as everywhere outside lib/db.
 */

export type PlanTargetType = 'spot' | 'community' | 'fair' | 'general';
export type PlanStatus = 'planning' | 'set' | 'cancelled';

export interface FriendPlan {
  id: string;
  momentId?: string;
  targetType: PlanTargetType;
  targetId?: string;
  title: string;
  image?: string;
  /** Who sent the post as an invitation */
  inviterId: string;
  /** Who answered "ไปกัน" */
  friendId: string;
  /** Thai date "YYYY-MM-DD", set in the chat */
  date?: string;
  status: PlanStatus;
  inviterWentAt?: string;
  friendWentAt?: string;
  remindedAt?: string;
  followedUpAt?: string;
  createdAt: string;
}

export type NewPlan = Pick<FriendPlan, 'momentId' | 'targetType' | 'targetId' | 'title' | 'image' | 'inviterId' | 'friendId'>;
export type PlanChange = Partial<Pick<FriendPlan, 'status' | 'inviterWentAt' | 'friendWentAt' | 'remindedAt' | 'followedUpAt'>> & { date?: string | null };

interface FriendPlanStore {
  /** The plan for this post and pair, made the first time */
  findOrCreate(plan: NewPlan): Promise<FriendPlan>;
  byId(id: string): Promise<FriendPlan | null>;
  /** The member's plans that are not called off, newest first */
  ofMember(memberId: string): Promise<FriendPlan[]>;
  /** Whether the two share a plan that is not called off (it opens their two-person chat) */
  between(a: string, b: string): Promise<boolean>;
  update(id: string, change: PlanChange): Promise<void>;
  /** Plans with a date from `from` to `to` (Thai dates), for the reminders */
  dated(from: string, to: string): Promise<FriendPlan[]>;
  removeBy(memberId: string): Promise<void>;
}

const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : undefined);
const isOpen = (p: FriendPlan) => p.status !== 'cancelled';
const has = (p: FriendPlan, memberId: string) => p.inviterId === memberId || p.friendId === memberId;

function jsonPlans(): FriendPlanStore {
  const store = createJsonStore<FriendPlan>('friend_plans');
  return {
    async findOrCreate(plan) {
      let found: FriendPlan | undefined;
      await store.update((items) => {
        found = plan.momentId ? items.find((p) => p.momentId === plan.momentId && p.inviterId === plan.inviterId && p.friendId === plan.friendId) : undefined;
        if (found) return items;
        const createdAt = new Date().toISOString();
        found = { ...plan, id: uuidV7(createdAt), status: 'planning', createdAt };
        return [...items, found];
      });
      return found!;
    },
    async byId(id) {
      return store.read().find((p) => p.id === id) ?? null;
    },
    async ofMember(memberId) {
      return store.read().filter((p) => isOpen(p) && has(p, memberId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async between(a, b) {
      return store.read().some((p) => isOpen(p) && has(p, a) && has(p, b));
    },
    async update(id, change) {
      const { date, ...rest } = change;
      await store.update((items) => items.map((p) => (p.id === id ? { ...p, ...rest, ...(date !== undefined ? { date: date ?? undefined } : {}) } : p)));
    },
    async dated(from, to) {
      return store.read().filter((p) => p.status === 'set' && p.date && p.date >= from && p.date <= to);
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((p) => !has(p, memberId)));
    },
  };
}

const memberRow = (db: Sql, id: string) => db`(select id from app.members where legacy_id = ${id})`;

function pgPlans(): FriendPlanStore {
  const select = (db: Sql) => db`
    select p.*, p.plan_date::text as day, mo.slug as moment, i.legacy_id as inviter, f.legacy_id as friend
    from app.friend_plans p
    join app.members i on i.id = p.inviter_id
    join app.members f on f.id = p.friend_id
    left join app.moments mo on mo.id = p.moment_id`;
  const toPlan = (r: Record<string, unknown>): FriendPlan => ({
    id: r.id as string,
    ...(r.moment ? { momentId: r.moment as string } : {}),
    targetType: r.target_type as PlanTargetType,
    ...(r.target_ref ? { targetId: r.target_ref as string } : {}),
    title: r.title as string,
    ...(r.image ? { image: r.image as string } : {}),
    inviterId: r.inviter as string,
    friendId: r.friend as string,
    ...(r.day ? { date: r.day as string } : {}),
    status: r.status as PlanStatus,
    inviterWentAt: iso(r.inviter_went_at),
    friendWentAt: iso(r.friend_went_at),
    remindedAt: iso(r.reminded_at),
    followedUpAt: iso(r.followed_up_at),
    createdAt: iso(r.created_at)!,
  });
  return {
    async findOrCreate(plan) {
      const db = sql();
      const createdAt = new Date().toISOString();
      const momentRow = plan.momentId ? db`(select id from app.moments where slug = ${plan.momentId})` : null;
      const inserted = await db`
        insert into app.friend_plans (id, moment_id, target_type, target_ref, title, image, inviter_id, friend_id, created_at, updated_at)
        values (${uuidV7(createdAt)}, ${momentRow}, ${plan.targetType}, ${plan.targetId ?? null}, ${plan.title}, ${plan.image ?? null},
                ${memberRow(db, plan.inviterId)}, ${memberRow(db, plan.friendId)}, ${createdAt}, ${createdAt})
        on conflict do nothing returning id`;
      const rows = inserted.length
        ? await db`${select(db)} where p.id = ${inserted[0].id}`
        : await db`${select(db)} where mo.slug = ${plan.momentId ?? ''} and i.legacy_id = ${plan.inviterId} and f.legacy_id = ${plan.friendId}`;
      return toPlan(rows[0]);
    },
    async byId(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const db = sql();
      const rows = await db`${select(db)} where p.id = ${id}`;
      return rows[0] ? toPlan(rows[0]) : null;
    },
    async ofMember(memberId) {
      const db = sql();
      const rows = await db`${select(db)} where p.status <> 'cancelled' and (i.legacy_id = ${memberId} or f.legacy_id = ${memberId}) order by p.created_at desc limit 50`;
      return rows.map(toPlan);
    },
    async between(a, b) {
      const db = sql();
      const rows = await db`
        select 1 from app.friend_plans p join app.members i on i.id = p.inviter_id join app.members f on f.id = p.friend_id
        where p.status <> 'cancelled' and ((i.legacy_id = ${a} and f.legacy_id = ${b}) or (i.legacy_id = ${b} and f.legacy_id = ${a})) limit 1`;
      return rows.length > 0;
    },
    async update(id, change) {
      const db = sql();
      const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (change.date !== undefined) set.plan_date = change.date;
      if (change.status) set.status = change.status;
      if (change.inviterWentAt !== undefined) set.inviter_went_at = change.inviterWentAt ?? null;
      if (change.friendWentAt !== undefined) set.friend_went_at = change.friendWentAt ?? null;
      if ('remindedAt' in change) set.reminded_at = change.remindedAt ?? null;
      if ('followedUpAt' in change) set.followed_up_at = change.followedUpAt ?? null;
      await db`update app.friend_plans set ${db(set)} where id = ${id}`;
    },
    async dated(from, to) {
      const db = sql();
      const rows = await db`${select(db)} where p.status = 'set' and p.plan_date between ${from}::date and ${to}::date`;
      return rows.map(toPlan);
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.friend_plans where inviter_id = ${memberRow(db, memberId)} or friend_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const friendPlanStore: FriendPlanStore = USE_POSTGRES ? pgPlans() : jsonPlans();
