import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { uuidV7 } from '../db/postgres/rows.mjs';
import { createJsonStore } from './jsonStore';

/**
 * Where "ไปกัน" group plans are kept (db/migrations/0045_group_plans.sql). The rules live in lib/social/friendPlans.ts;
 * this file only reads and writes. Member, moment and target ids are the app's own ids, as everywhere outside lib/db.
 */

export type PlanTargetType = 'spot' | 'community' | 'fair' | 'quest' | 'general';
export type PlanStatus = 'planning' | 'set' | 'cancelled';
export type PlanMemberState = 'invited' | 'going';

export interface PlanMember {
  memberId: string;
  state: PlanMemberState;
  wentAt?: string;
  joinedAt: string;
}

export interface FriendPlan {
  id: string;
  hostId: string;
  targetType: PlanTargetType;
  targetId?: string;
  momentId?: string;
  title: string;
  image?: string;
  /** Thai date "YYYY-MM-DD", set in the chat */
  date?: string;
  status: PlanStatus;
  remindedAt?: string;
  followedUpAt?: string;
  createdAt: string;
  /** Last change to the plan (people, day); a plan with no day that stays quiet closes (runPlanReminders) */
  updatedAt?: string;
  /** The days each person marked free, by member id ("YYYY-MM-DD", sorted) */
  freeDays?: Record<string, string[]>;
  /** Everyone in the plan, the host included (state 'going') */
  members: PlanMember[];
}

export type NewPlan = Pick<FriendPlan, 'hostId' | 'targetType' | 'targetId' | 'momentId' | 'title' | 'image'>;
export type PlanChange = Partial<Pick<FriendPlan, 'status' | 'remindedAt' | 'followedUpAt'>> & { date?: string | null; closedIdle?: boolean };

interface FriendPlanStore {
  create(plan: NewPlan): Promise<FriendPlan>;
  byId(id: string): Promise<FriendPlan | null>;
  /** The host's open plans for one target, newest first */
  openOfHost(hostId: string, targetType: PlanTargetType, targetId: string | undefined, momentId: string | undefined): Promise<FriendPlan[]>;
  /** The plans the member is in (invited or going) that are not called off, newest first */
  ofMember(memberId: string): Promise<FriendPlan[]>;
  /** Adds people (or moves 'invited' to 'going'); someone already going stays going */
  setMembers(planId: string, memberIds: string[], state: PlanMemberState): Promise<void>;
  markWent(planId: string, memberId: string, at: string): Promise<void>;
  /** A guest leaves (or turns down) a plan */
  removeMember(planId: string, memberId: string): Promise<void>;
  update(id: string, change: PlanChange): Promise<void>;
  /** Plans with a date from `from` to `to` (Thai dates), for the reminders */
  dated(from: string, to: string): Promise<FriendPlan[]>;
  /** Open plans with no day, unchanged since `before` (ISO time) */
  quietUndated(before: string): Promise<FriendPlan[]>;
  /** Replaces the days this member is free */
  setFreeDays(planId: string, memberId: string, days: string[]): Promise<void>;
  /** Counts a "รอบนี้ไม่สะดวก" */
  noteDecline(planId: string): Promise<void>;
  removeBy(memberId: string): Promise<void>;
}

const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : undefined);
const isOpen = (p: FriendPlan) => p.status !== 'cancelled';
const sameTarget = (p: FriendPlan, type: PlanTargetType, targetId?: string, momentId?: string) =>
  p.targetType === type && (type === 'general' ? p.momentId === momentId : p.targetId === targetId);

function jsonPlans(): FriendPlanStore {
  const store = createJsonStore<FriendPlan>('friend_plans_v2');
  const now = () => new Date().toISOString();
  return {
    async create(plan) {
      const createdAt = now();
      const made: FriendPlan = { ...plan, id: uuidV7(createdAt), status: 'planning', createdAt, members: [{ memberId: plan.hostId, state: 'going', joinedAt: createdAt }] };
      await store.update((items) => [...items, made]);
      return made;
    },
    async byId(id) {
      return store.read().find((p) => p.id === id) ?? null;
    },
    async openOfHost(hostId, type, targetId, momentId) {
      return store.read().filter((p) => isOpen(p) && p.hostId === hostId && sameTarget(p, type, targetId, momentId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async ofMember(memberId) {
      return store.read().filter((p) => isOpen(p) && p.members.some((m) => m.memberId === memberId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async setMembers(planId, ids, state) {
      const at = now();
      await store.update((items) =>
        items.map((p) => {
          if (p.id !== planId) return p;
          const members = [...p.members];
          for (const id of ids) {
            const held = members.find((m) => m.memberId === id);
            if (!held) members.push({ memberId: id, state, joinedAt: at });
            else if (state === 'going') held.state = 'going';
          }
          return { ...p, members, updatedAt: at };
        })
      );
    },
    async markWent(planId, memberId, at) {
      await store.update((items) => items.map((p) => (p.id === planId ? { ...p, members: p.members.map((m) => (m.memberId === memberId ? { ...m, wentAt: at } : m)) } : p)));
    },
    async removeMember(planId, memberId) {
      await store.update((items) =>
        items.map((p) => {
          if (p.id !== planId) return p;
          const freeDays = { ...(p.freeDays ?? {}) };
          delete freeDays[memberId];
          return { ...p, members: p.members.filter((m) => m.memberId !== memberId), freeDays };
        })
      );
    },
    async update(id, change) {
      const { date, closedIdle, ...rest } = change;
      void closedIdle;
      await store.update((items) => items.map((p) => (p.id === id ? { ...p, ...rest, ...(date !== undefined ? { date: date ?? undefined } : {}), updatedAt: now() } : p)));
    },
    async dated(from, to) {
      return store.read().filter((p) => p.status === 'set' && p.date && p.date >= from && p.date <= to);
    },
    async quietUndated(before) {
      return store.read().filter((p) => p.status === 'planning' && !p.date && (p.updatedAt ?? p.createdAt) < before);
    },
    async setFreeDays(planId, memberId, days) {
      await store.update((items) => items.map((p) => (p.id === planId ? { ...p, freeDays: { ...(p.freeDays ?? {}), [memberId]: [...days].sort() } } : p)));
    },
    async noteDecline() {
      // Counted for the admin numbers, which need the database
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((p) => p.hostId !== memberId).map((p) => ({ ...p, members: p.members.filter((m) => m.memberId !== memberId) })));
    },
  };
}

const memberRow = (db: Sql, id: string) => db`(select id from app.members where legacy_id = ${id})`;

function pgPlans(): FriendPlanStore {
  const select = (db: Sql) => db`
    select p.*, p.plan_date::text as day, mo.slug as moment, h.legacy_id as host,
      coalesce((select json_agg(json_build_object('memberId', m2.legacy_id, 'state', pm.state, 'wentAt', pm.went_at, 'joinedAt', pm.created_at) order by pm.created_at)
        from app.friend_plan_members pm join app.members m2 on m2.id = pm.member_id where pm.plan_id = p.id), '[]'::json) as people,
      coalesce((select json_object_agg(m3.legacy_id, x.days) from (select pd.member_id, json_agg(pd.day::text order by pd.day) as days
        from app.friend_plan_days pd where pd.plan_id = p.id group by pd.member_id) x join app.members m3 on m3.id = x.member_id), '{}'::json) as free_days
    from app.friend_plans p
    join app.members h on h.id = p.host_id
    left join app.moments mo on mo.id = p.moment_id`;
  const toPlan = (r: Record<string, unknown>): FriendPlan => ({
    id: r.id as string,
    hostId: r.host as string,
    targetType: r.target_type as PlanTargetType,
    ...(r.target_ref ? { targetId: r.target_ref as string } : {}),
    ...(r.moment ? { momentId: r.moment as string } : {}),
    title: r.title as string,
    ...(r.image ? { image: r.image as string } : {}),
    ...(r.day ? { date: r.day as string } : {}),
    status: r.status as PlanStatus,
    remindedAt: iso(r.reminded_at),
    followedUpAt: iso(r.followed_up_at),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at),
    freeDays: (r.free_days as Record<string, string[]>) ?? {},
    members: (r.people as { memberId: string; state: PlanMemberState; wentAt?: string | null; joinedAt: string }[]).map((m) => ({
      memberId: m.memberId,
      state: m.state,
      ...(m.wentAt ? { wentAt: iso(m.wentAt) } : {}),
      joinedAt: iso(m.joinedAt)!,
    })),
  });
  return {
    async create(plan) {
      const db = sql();
      const createdAt = new Date().toISOString();
      const id = uuidV7(createdAt);
      const momentRow = plan.momentId ? db`(select id from app.moments where slug = ${plan.momentId})` : null;
      await db.begin(async (tx) => {
        await tx`
          insert into app.friend_plans (id, host_id, target_type, target_ref, moment_id, title, image, created_at, updated_at)
          values (${id}, ${memberRow(tx, plan.hostId)}, ${plan.targetType}, ${plan.targetId ?? null}, ${momentRow}, ${plan.title}, ${plan.image ?? null}, ${createdAt}, ${createdAt})`;
        await tx`insert into app.friend_plan_members (plan_id, member_id, state, created_at) values (${id}, ${memberRow(tx, plan.hostId)}, 'going', ${createdAt})`;
      });
      return (await this.byId(id))!;
    },
    async byId(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const db = sql();
      const rows = await db`${select(db)} where p.id = ${id}`;
      return rows[0] ? toPlan(rows[0]) : null;
    },
    async openOfHost(hostId, type, targetId, momentId) {
      const db = sql();
      const target = type === 'general' ? db`mo.slug = ${momentId ?? ''}` : db`p.target_ref = ${targetId ?? ''}`;
      const rows = await db`${select(db)} where p.status <> 'cancelled' and h.legacy_id = ${hostId} and p.target_type = ${type} and ${target} order by p.created_at desc limit 5`;
      return rows.map(toPlan);
    },
    async ofMember(memberId) {
      const db = sql();
      const rows = await db`${select(db)}
        where p.status <> 'cancelled' and p.id in (select plan_id from app.friend_plan_members where member_id = ${memberRow(db, memberId)})
        order by p.created_at desc limit 50`;
      return rows.map(toPlan);
    },
    async setMembers(planId, ids, state) {
      if (ids.length === 0) return;
      const db = sql();
      await db`
        insert into app.friend_plan_members (plan_id, member_id, state)
        select ${planId}, m.id, ${state} from app.members m where m.legacy_id in ${db(ids)}
        on conflict (plan_id, member_id) do update set state = case when excluded.state = 'going' then 'going' else app.friend_plan_members.state end`;
      await db`update app.friend_plans set updated_at = now() where id = ${planId}`;
    },
    async markWent(planId, memberId, at) {
      const db = sql();
      await db`update app.friend_plan_members set went_at = ${at} where plan_id = ${planId} and member_id = ${memberRow(db, memberId)}`;
    },
    async removeMember(planId, memberId) {
      const db = sql();
      await db`delete from app.friend_plan_members where plan_id = ${planId} and member_id = ${memberRow(db, memberId)}`;
      await db`delete from app.friend_plan_days where plan_id = ${planId} and member_id = ${memberRow(db, memberId)}`;
    },
    async update(id, change) {
      const db = sql();
      const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (change.date !== undefined) set.plan_date = change.date;
      if (change.status) set.status = change.status;
      if ('remindedAt' in change) set.reminded_at = change.remindedAt ?? null;
      if ('followedUpAt' in change) set.followed_up_at = change.followedUpAt ?? null;
      if (change.closedIdle) set.closed_idle_at = new Date().toISOString();
      await db`update app.friend_plans set ${db(set)} where id = ${id}`;
    },
    async dated(from, to) {
      const db = sql();
      const rows = await db`${select(db)} where p.status = 'set' and p.plan_date between ${from}::date and ${to}::date`;
      return rows.map(toPlan);
    },
    async quietUndated(before) {
      const db = sql();
      const rows = await db`${select(db)} where p.status = 'planning' and p.plan_date is null and p.updated_at < ${before} limit 200`;
      return rows.map(toPlan);
    },
    async setFreeDays(planId, memberId, days) {
      const db = sql();
      await db.begin(async (tx) => {
        await tx`delete from app.friend_plan_days where plan_id = ${planId} and member_id = ${memberRow(tx, memberId)}`;
        if (days.length) await tx`insert into app.friend_plan_days (plan_id, member_id, day) select ${planId}, m.id, d::date from app.members m, unnest(${days}::text[]) as d where m.legacy_id = ${memberId}`;
        await tx`update app.friend_plans set updated_at = now() where id = ${planId}`;
      });
    },
    async noteDecline(planId) {
      const db = sql();
      await db`update app.friend_plans set declines = declines + 1 where id = ${planId}`;
    },
    async removeBy(memberId) {
      const db = sql();
      // Plans the member hosts go with them; in other plans only their own row goes (the table cascades both)
      await db`delete from app.friend_plans where host_id = ${memberRow(db, memberId)}`;
      await db`delete from app.friend_plan_members where member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const friendPlanStore: FriendPlanStore = USE_POSTGRES ? pgPlans() : jsonPlans();
