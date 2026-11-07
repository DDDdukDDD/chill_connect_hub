import { randomUUID } from 'node:crypto';
import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { createJsonStore } from './jsonStore';
import type { ContentReport } from './contentReports';
import type { FairGroup } from './fairGroups';
import type { QuestFinish } from './questFinishes';
import type { QuestJoin } from './questJoins';
import type { QuestVoucher } from './questVouchers';
import type { EventReview } from './reviews';
import type { Redemption } from './rewardsLedger';
import type { MarkedVisit } from './visits';
import type { EventQuestion } from './eventQuestions';
import type { MeetAgainPick } from './meetAgain';
import type { WaitlistEntry } from './waitlist';

/**
 * Where members' activity is kept: tables when DATA_STORE=postgres (every server sees the same data), JSON files
 * for a clone without a database. The rules live in each feature's file; this one only reads and writes.
 * The app's ids are looked up where the database keeps its own: members by legacy_id, the rest by slug.
 */

const memberRow = (tx: Sql, id: string) => tx`(select id from app.members where legacy_id = ${id})`;
const eventRow = (tx: Sql, id: string) => tx`(select id from app.events where slug = ${id})`;
const questRow = (tx: Sql, id: string) => tx`(select id from app.quests where slug = ${id})`;
const iso = (value: unknown) => new Date(value as string).toISOString();
const isoOrNone = (value: unknown) => (value ? iso(value) : undefined);

/* ---------- Marked visits ---------- */

type VisitTarget = { targetType: string; targetId: string };

interface VisitStore {
  forTargets(targets: VisitTarget[]): Promise<MarkedVisit[]>;
  ofMember(memberId: string): Promise<MarkedVisit[]>;
  save(mark: MarkedVisit, isNew: boolean): Promise<MarkedVisit>;
  remove(memberId: string, targetType: 'spot' | 'fair', targetId: string): Promise<void>;
  removeBy(memberId: string): Promise<void>;
}

function jsonVisits(): VisitStore {
  const store = createJsonStore<MarkedVisit>('visits');
  return {
    async forTargets(targets) {
      const wanted = new Set(targets.map((t) => `${t.targetType}:${t.targetId}`));
      return store.read().filter((m) => wanted.has(`${m.targetType}:${m.targetId}`));
    },
    async ofMember(memberId) {
      return store.read().filter((m) => m.memberId === memberId);
    },
    async save(mark) {
      await store.update((items) => [mark, ...items.filter((m) => m.id !== mark.id)]);
      return mark;
    },
    async remove(memberId, targetType, targetId) {
      await store.update((items) => items.filter((m) => !(m.memberId === memberId && m.targetType === targetType && m.targetId === targetId)));
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((m) => m.memberId !== memberId));
    },
  };
}

function pgVisits(): VisitStore {
  const toMark = (r: Record<string, unknown>): MarkedVisit => ({
    id: r.id as string,
    memberId: r.member as string,
    targetType: r.place ? 'spot' : 'fair',
    targetId: (r.place ?? r.event) as string,
    rating: (r.rating as number | null) ?? undefined,
    review: (r.review as string | null) ?? undefined,
    reviewedAt: isoOrNone(r.reviewed_at),
    createdAt: iso(r.created_at),
  });
  const select = (db: Sql) => db`
    select v.id::text, m.legacy_id as member, p.slug as place, e.slug as event, v.rating, v.review, v.reviewed_at, v.created_at
    from app.visits v
    join app.members m on m.id = v.member_id
    left join app.places p on p.id = v.place_id
    left join app.events e on e.id = v.event_id`;
  return {
    async forTargets(targets) {
      const spots = targets.filter((t) => t.targetType === 'spot').map((t) => t.targetId);
      const fairs = targets.filter((t) => t.targetType === 'fair').map((t) => t.targetId);
      if (spots.length === 0 && fairs.length === 0) return [];
      const db = sql();
      const rows = await db`${select(db)} where v.evidence = 'marked' and (p.slug = any(${db.array(spots)}::text[]) or e.slug = any(${db.array(fairs)}::text[])) order by v.created_at desc`;
      return rows.map(toMark);
    },
    async ofMember(memberId) {
      const db = sql();
      const rows = await db`${select(db)} where v.evidence = 'marked' and m.legacy_id = ${memberId} order by v.created_at desc`;
      return rows.map(toMark);
    },
    async save(mark, isNew) {
      const db = sql();
      const rating = mark.rating ?? null;
      const review = mark.review ?? null;
      const reviewedAt = mark.reviewedAt ?? null;
      if (!isNew) {
        await db`update app.visits set rating = ${rating}, review = ${review}, reviewed_at = ${reviewedAt}::timestamptz where id::text = ${mark.id}`;
        return mark;
      }
      const place = mark.targetType === 'spot' ? db`(select id from app.places where slug = ${mark.targetId})` : db`null::uuid`;
      const event = mark.targetType === 'fair' ? db`${eventRow(db, mark.targetId)}` : db`null::uuid`;
      const [row] = await db`
        insert into app.visits (member_id, place_id, event_id, evidence, rating, review, reviewed_at)
        values (${memberRow(db, mark.memberId)}, ${place}, ${event}, 'marked', ${rating}, ${review}, ${reviewedAt}::timestamptz)
        on conflict do nothing
        returning id::text`;
      return row ? { ...mark, id: row.id } : mark;
    },
    async remove(memberId, targetType, targetId) {
      const db = sql();
      const target = targetType === 'spot' ? db`place_id = (select id from app.places where slug = ${targetId})` : db`event_id = ${eventRow(db, targetId)}`;
      await db`delete from app.visits where evidence = 'marked' and member_id = ${memberRow(db, memberId)} and ${target}`;
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.visits where evidence = 'marked' and member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const visitStore: VisitStore = USE_POSTGRES ? pgVisits() : jsonVisits();

/* ---------- Challenge joins and finishes ---------- */

interface QuestMemberStore {
  /** Current joins; a member who left is not among them */
  joins(filter?: { memberId?: string; questId?: string }): Promise<QuestJoin[]>;
  joinCounts(): Promise<Map<string, number>>;
  join(memberId: string, questId: string): Promise<void>;
  leave(memberId: string, questId: string): Promise<void>;
  finishes(filter?: { memberId?: string; questId?: string }): Promise<QuestFinish[]>;
  /** Records the finishes not recorded yet and returns those */
  recordFinishes(memberId: string, questIds: string[]): Promise<string[]>;
  removeBy(memberId: string): Promise<void>;
}

function jsonQuestMembers(): QuestMemberStore {
  const joins = createJsonStore<QuestJoin>('quest_joins');
  const finishes = createJsonStore<QuestFinish>('quest_finishes');
  const fits = (item: { memberId: string; questId: string }, f?: { memberId?: string; questId?: string }) =>
    (!f?.memberId || item.memberId === f.memberId) && (!f?.questId || item.questId === f.questId);
  return {
    async joins(filter) {
      return joins.read().filter((j) => fits(j, filter));
    },
    async joinCounts() {
      const counts = new Map<string, number>();
      for (const join of joins.read()) counts.set(join.questId, (counts.get(join.questId) ?? 0) + 1);
      return counts;
    },
    async join(memberId, questId) {
      await joins.update((items) =>
        items.some((j) => j.memberId === memberId && j.questId === questId) ? items : [{ id: `qj_${randomUUID()}`, memberId, questId, joinedAt: new Date().toISOString() }, ...items]
      );
    },
    async leave(memberId, questId) {
      await joins.update((items) => items.filter((j) => !(j.memberId === memberId && j.questId === questId)));
    },
    async finishes(filter) {
      return finishes.read().filter((f) => fits(f, filter));
    },
    async recordFinishes(memberId, questIds) {
      const known = new Set(finishes.read().filter((f) => f.memberId === memberId).map((f) => f.questId));
      const fresh = questIds.filter((id) => !known.has(id));
      if (fresh.length === 0) return [];
      const finishedAt = new Date().toISOString();
      await finishes.update((items) => [...fresh.map((questId) => ({ memberId, questId, finishedAt })), ...items]);
      return fresh;
    },
    async removeBy(memberId) {
      await joins.update((items) => items.filter((j) => j.memberId !== memberId));
      await finishes.update((items) => items.filter((f) => f.memberId !== memberId));
    },
  };
}

function pgQuestMembers(): QuestMemberStore {
  const where = (db: Sql, f?: { memberId?: string; questId?: string }) => db`
    ${f?.memberId ? db`and m.legacy_id = ${f.memberId}` : db``} ${f?.questId ? db`and q.slug = ${f.questId}` : db``}`;
  return {
    async joins(filter) {
      const db = sql();
      const rows = await db`
        select m.legacy_id as member, q.slug as quest, p.joined_at
        from app.quest_participants p join app.members m on m.id = p.member_id join app.quests q on q.id = p.quest_id
        where p.left_at is null ${where(db, filter)}
        order by p.joined_at desc`;
      return rows.map((r) => ({ id: `${r.quest}:${r.member}`, memberId: r.member, questId: r.quest, joinedAt: iso(r.joined_at) }));
    },
    async joinCounts() {
      const rows = await sql()`
        select q.slug, count(*)::int as n from app.quest_participants p join app.quests q on q.id = p.quest_id
        where p.left_at is null group by q.slug`;
      return new Map(rows.map((r) => [r.slug as string, r.n as number]));
    },
    async join(memberId, questId) {
      const db = sql();
      await db`
        insert into app.quest_participants (quest_id, member_id) values (${questRow(db, questId)}, ${memberRow(db, memberId)})
        on conflict (quest_id, member_id) do update set left_at = null`;
    },
    async leave(memberId, questId) {
      await sql().begin(async (tx) => {
        const match = tx`quest_id = ${questRow(tx, questId)} and member_id = ${memberRow(tx, memberId)}`;
        await tx`delete from app.quest_participants where ${match} and finished_at is null`;
        await tx`update app.quest_participants set left_at = now() where ${match}`;
      });
    },
    async finishes(filter) {
      const db = sql();
      const rows = await db`
        select m.legacy_id as member, q.slug as quest, p.finished_at
        from app.quest_participants p join app.members m on m.id = p.member_id join app.quests q on q.id = p.quest_id
        where p.finished_at is not null ${where(db, filter)}
        order by p.finished_at desc`;
      return rows.map((r) => ({ memberId: r.member, questId: r.quest, finishedAt: iso(r.finished_at) }));
    },
    async recordFinishes(memberId, questIds) {
      if (questIds.length === 0) return [];
      const db = sql();
      // Only one request can turn a row from unfinished to finished, so the member is told once
      const rows = await db`
        update app.quest_participants p set finished_at = now()
        from app.quests q
        where q.id = p.quest_id and p.member_id = ${memberRow(db, memberId)} and p.finished_at is null and q.slug = any(${db.array(questIds)}::text[])
        returning q.slug`;
      return rows.map((r) => r.slug as string);
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.quest_participants where member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const questMemberStore: QuestMemberStore = USE_POSTGRES ? pgQuestMembers() : jsonQuestMembers();

/* ---------- Partner reward codes ---------- */

interface VoucherStore {
  find(memberId: string, questId: string): Promise<QuestVoucher | undefined>;
  ofMember(memberId: string): Promise<QuestVoucher[]>;
  findByCode(code: string): Promise<QuestVoucher | undefined>;
  /** Saves the code unless the member already has one for this challenge; returns the one that stands */
  issue(voucher: QuestVoucher): Promise<QuestVoucher | undefined>;
  markUsed(code: string): Promise<QuestVoucher | undefined>;
  removeBy(memberId: string): Promise<void>;
}

function jsonVouchers(): VoucherStore {
  const store = createJsonStore<QuestVoucher>('quest_vouchers');
  return {
    async find(memberId, questId) {
      return store.read().find((v) => v.memberId === memberId && v.questId === questId);
    },
    async ofMember(memberId) {
      return store.read().filter((v) => v.memberId === memberId);
    },
    async findByCode(code) {
      return store.read().find((v) => v.code === code);
    },
    async issue(voucher) {
      let issued: QuestVoucher | undefined;
      await store.update((items) => {
        issued = items.find((v) => v.memberId === voucher.memberId && v.questId === voucher.questId);
        if (issued) return items;
        if (items.some((v) => v.code === voucher.code)) return items;
        issued = voucher;
        return [voucher, ...items];
      });
      return issued;
    },
    async markUsed(code) {
      let marked: QuestVoucher | undefined;
      await store.update((items) =>
        items.map((v) => {
          if (v.code !== code) return v;
          marked = v.usedAt ? v : { ...v, usedAt: new Date().toISOString() };
          return marked;
        })
      );
      return marked;
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((v) => v.memberId !== memberId));
    },
  };
}

function pgVouchers(): VoucherStore {
  const toVoucher = (r: Record<string, unknown>): QuestVoucher => ({ code: r.code as string, memberId: r.member as string, questId: r.quest as string, issuedAt: iso(r.issued_at), usedAt: isoOrNone(r.used_at) });
  const select = (db: Sql) => db`
    select v.code, m.legacy_id as member, q.slug as quest, v.issued_at, v.used_at
    from app.quest_vouchers v join app.members m on m.id = v.member_id join app.quests q on q.id = v.quest_id`;
  const store: VoucherStore = {
    async find(memberId, questId) {
      const db = sql();
      const [row] = await db`${select(db)} where m.legacy_id = ${memberId} and q.slug = ${questId}`;
      return row ? toVoucher(row) : undefined;
    },
    async ofMember(memberId) {
      const db = sql();
      return (await db`${select(db)} where m.legacy_id = ${memberId} order by v.issued_at desc`).map(toVoucher);
    },
    async findByCode(code) {
      const db = sql();
      const [row] = await db`${select(db)} where v.code = ${code}`;
      return row ? toVoucher(row) : undefined;
    },
    async issue(voucher) {
      const db = sql();
      await db`
        insert into app.quest_vouchers (code, quest_id, member_id)
        values (${voucher.code}, ${questRow(db, voucher.questId)}, ${memberRow(db, voucher.memberId)})
        on conflict do nothing`;
      return store.find(voucher.memberId, voucher.questId);
    },
    async markUsed(code) {
      await sql()`update app.quest_vouchers set used_at = now() where code = ${code} and used_at is null`;
      return store.findByCode(code);
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.quest_vouchers where member_id = ${memberRow(db, memberId)}`;
    },
  };
  return store;
}

export const voucherStore: VoucherStore = USE_POSTGRES ? pgVouchers() : jsonVouchers();

/* ---------- Rewards spent ---------- */

interface RedemptionStore {
  ofMember(memberId: string): Promise<Redemption[]>;
  countOf(rewardId: string): Promise<number>;
  /** Every entry of one reward, for the prize draw */
  ofReward(rewardId: string): Promise<Redemption[]>;
  /** False when the member already has this reward */
  add(redemption: Omit<Redemption, 'id' | 'createdAt'>): Promise<boolean>;
  removeBy(memberId: string): Promise<void>;
}

function jsonRedemptions(): RedemptionStore {
  const store = createJsonStore<Redemption>('redemptions');
  return {
    async ofMember(memberId) {
      return store.read().filter((r) => r.memberId === memberId);
    },
    async countOf(rewardId) {
      return store.read().filter((r) => r.rewardId === rewardId).length;
    },
    async ofReward(rewardId) {
      return store.read().filter((r) => r.rewardId === rewardId);
    },
    async add(redemption) {
      let added = false;
      await store.update((items) => {
        if (items.some((r) => r.memberId === redemption.memberId && r.rewardId === redemption.rewardId)) return items;
        added = true;
        return [{ ...redemption, id: `red_${randomUUID()}`, createdAt: new Date().toISOString() }, ...items];
      });
      return added;
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((r) => r.memberId !== memberId));
    },
  };
}

function pgRedemptions(): RedemptionStore {
  return {
    async ofMember(memberId) {
      const db = sql();
      const rows = await db`
        select x.id::text, w.slug as reward, x.cost_xp, x.created_at
        from app.reward_redemptions x join app.rewards w on w.id = x.reward_id
        where x.member_id = ${memberRow(db, memberId)} order by x.created_at desc`;
      return rows.map((r) => ({ id: r.id, memberId, rewardId: r.reward, cost: r.cost_xp, createdAt: iso(r.created_at) }));
    },
    async countOf(rewardId) {
      const [row] = await sql()`
        select count(*)::int as n from app.reward_redemptions x join app.rewards w on w.id = x.reward_id where w.slug = ${rewardId}`;
      return row.n;
    },
    async ofReward(rewardId) {
      const rows = await sql()`
        select x.id::text, m.legacy_id as member, x.cost_xp, x.created_at
        from app.reward_redemptions x join app.rewards w on w.id = x.reward_id join app.members m on m.id = x.member_id
        where w.slug = ${rewardId}`;
      return rows.map((r) => ({ id: r.id, memberId: r.member, rewardId, cost: r.cost_xp, createdAt: iso(r.created_at) }));
    },
    async add(redemption) {
      const db = sql();
      const rows = await db`
        insert into app.reward_redemptions (reward_id, member_id, cost_xp, voucher_code)
        select w.id, ${memberRow(db, redemption.memberId)}, ${redemption.cost}, ${randomUUID()}
        from app.rewards w where w.slug = ${redemption.rewardId}
        on conflict (reward_id, member_id) do nothing
        returning id`;
      return rows.length > 0;
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.reward_redemptions where member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const redemptionStore: RedemptionStore = USE_POSTGRES ? pgRedemptions() : jsonRedemptions();

/* ---------- Reviews of a ตี้ ---------- */

interface ReviewStore {
  byAuthor(authorId: string): Promise<EventReview[]>;
  aboutHost(hostId: string): Promise<EventReview[]>;
  find(id: string): Promise<EventReview | undefined>;
  add(review: Omit<EventReview, 'id' | 'createdAt'>): Promise<EventReview>;
  remove(id: string): Promise<boolean>;
  removeBy(authorId: string): Promise<void>;
}

function jsonReviews(): ReviewStore {
  const store = createJsonStore<EventReview>('reviews');
  return {
    async byAuthor(authorId) {
      return store.read().filter((r) => r.authorId === authorId);
    },
    async aboutHost(hostId) {
      return store.read().filter((r) => r.hostId === hostId);
    },
    async find(id) {
      return store.read().find((r) => r.id === id);
    },
    async add(review) {
      const saved: EventReview = { ...review, id: `rev_${randomUUID()}`, createdAt: new Date().toISOString() };
      await store.update((items) => [saved, ...items]);
      return saved;
    },
    async remove(id) {
      if (!store.read().some((r) => r.id === id)) return false;
      await store.update((items) => items.filter((r) => r.id !== id));
      return true;
    },
    async removeBy(authorId) {
      await store.update((items) => items.filter((r) => r.authorId !== authorId));
    },
  };
}

function pgReviews(): ReviewStore {
  const toReview = (r: Record<string, unknown>): EventReview => ({
    id: r.id as string,
    eventId: r.event as string,
    eventTitle: r.title as string,
    hostId: (r.host as string | null) ?? undefined,
    authorId: r.author as string,
    rating: r.rating as number,
    text: r.body as string,
    createdAt: iso(r.created_at),
  });
  const select = (db: Sql) => db`
    select r.id::text, e.slug as event, e.title, h.legacy_id as host, a.legacy_id as author, r.rating, r.body, r.created_at
    from app.event_reviews r
    join app.events e on e.id = r.event_id
    join app.members a on a.id = r.author_id
    left join app.members h on h.id = e.host_member_id`;
  return {
    async byAuthor(authorId) {
      const db = sql();
      return (await db`${select(db)} where a.legacy_id = ${authorId} order by r.created_at desc`).map(toReview);
    },
    async aboutHost(hostId) {
      const db = sql();
      return (await db`${select(db)} where h.legacy_id = ${hostId} order by r.created_at desc`).map(toReview);
    },
    async find(id) {
      const db = sql();
      const [row] = await db`${select(db)} where r.id::text = ${id}`;
      return row ? toReview(row) : undefined;
    },
    async add(review) {
      const db = sql();
      const [row] = await db`
        insert into app.event_reviews (event_id, author_id, rating, body)
        values (${eventRow(db, review.eventId)}, ${memberRow(db, review.authorId)}, ${review.rating}, ${review.text})
        on conflict (event_id, author_id) do update set rating = excluded.rating, body = excluded.body
        returning id::text, created_at`;
      return { ...review, id: row.id, createdAt: iso(row.created_at) };
    },
    async remove(id) {
      return (await sql()`delete from app.event_reviews where id::text = ${id} returning id`).length > 0;
    },
    async removeBy(authorId) {
      const db = sql();
      await db`delete from app.event_reviews where author_id = ${memberRow(db, authorId)}`;
    },
  };
}

export const reviewStore: ReviewStore = USE_POSTGRES ? pgReviews() : jsonReviews();

/* ---------- Waiting list ---------- */

interface WaitlistStore {
  /** The line of one ตี้, first in line first */
  line(eventId: string): Promise<WaitlistEntry[]>;
  add(eventId: string, memberId: string): Promise<void>;
  remove(eventId: string, memberId: string): Promise<void>;
  clear(eventId: string): Promise<void>;
  /** Takes out those whose offer ran out and marks those now offered a seat */
  move(eventId: string, expiredIds: string[], offerIds: string[]): Promise<void>;
  removeOf(memberId: string): Promise<void>;
  /** Every ตี้ that has someone in line (for the hourly job) */
  eventIds(): Promise<string[]>;
}

function jsonWaitlist(): WaitlistStore {
  const store = createJsonStore<WaitlistEntry>('waitlist');
  return {
    async eventIds() {
      return [...new Set(store.read().map((e) => e.eventId))];
    },
    async line(eventId) {
      return store.read().filter((e) => e.eventId === eventId).sort((a, b) => a.at.localeCompare(b.at));
    },
    async add(eventId, memberId) {
      await store.update((items) => (items.some((e) => e.eventId === eventId && e.memberId === memberId) ? items : [...items, { eventId, memberId, at: new Date().toISOString() }]));
    },
    async remove(eventId, memberId) {
      await store.update((items) => items.filter((e) => !(e.eventId === eventId && e.memberId === memberId)));
    },
    async clear(eventId) {
      await store.update((items) => items.filter((e) => e.eventId !== eventId));
    },
    async move(eventId, expiredIds, offerIds) {
      const at = new Date().toISOString();
      await store.update((items) =>
        items
          .filter((e) => !(e.eventId === eventId && expiredIds.includes(e.memberId)))
          .map((e) => (e.eventId === eventId && offerIds.includes(e.memberId) ? { ...e, offeredAt: at } : e))
      );
    },
    async removeOf(memberId) {
      await store.update((items) => items.filter((e) => e.memberId !== memberId));
    },
  };
}

function pgWaitlist(): WaitlistStore {
  return {
    async eventIds() {
      const rows = await sql()`select distinct e.slug from app.event_waitlist w join app.events e on e.id = w.event_id`;
      return rows.map((r) => r.slug as string);
    },
    async line(eventId) {
      const db = sql();
      const rows = await db`
        select m.legacy_id as member, w.joined_at, w.offered_at
        from app.event_waitlist w join app.members m on m.id = w.member_id
        where w.event_id = ${eventRow(db, eventId)} order by w.joined_at`;
      return rows.map((r) => ({ eventId, memberId: r.member, at: iso(r.joined_at), offeredAt: isoOrNone(r.offered_at) }));
    },
    async add(eventId, memberId) {
      const db = sql();
      await db`insert into app.event_waitlist (event_id, member_id) values (${eventRow(db, eventId)}, ${memberRow(db, memberId)}) on conflict do nothing`;
    },
    async remove(eventId, memberId) {
      const db = sql();
      await db`delete from app.event_waitlist where event_id = ${eventRow(db, eventId)} and member_id = ${memberRow(db, memberId)}`;
    },
    async clear(eventId) {
      const db = sql();
      await db`delete from app.event_waitlist where event_id = ${eventRow(db, eventId)}`;
    },
    async move(eventId, expiredIds, offerIds) {
      await sql().begin(async (tx) => {
        await tx`delete from app.event_waitlist w using app.members m where m.id = w.member_id and w.event_id = ${eventRow(tx, eventId)} and m.legacy_id = any(${tx.array(expiredIds)}::text[])`;
        await tx`update app.event_waitlist w set offered_at = now() from app.members m where m.id = w.member_id and w.event_id = ${eventRow(tx, eventId)} and m.legacy_id = any(${tx.array(offerIds)}::text[])`;
      });
    },
    async removeOf(memberId) {
      const db = sql();
      await db`delete from app.event_waitlist where member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const waitlistStore: WaitlistStore = USE_POSTGRES ? pgWaitlist() : jsonWaitlist();

/* ---------- Questions to the host ---------- */

interface QuestionStore {
  ofEvent(eventId: string): Promise<EventQuestion[]>;
  find(id: string, eventId: string): Promise<EventQuestion | undefined>;
  add(eventId: string, authorId: string, text: string): Promise<EventQuestion>;
  answer(id: string, text: string): Promise<void>;
  hide(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  removeOf(memberId: string): Promise<void>;
}

function jsonQuestions(): QuestionStore {
  const store = createJsonStore<EventQuestion>('event_questions');
  return {
    async ofEvent(eventId) {
      return store.read().filter((q) => q.eventId === eventId);
    },
    async find(id, eventId) {
      return store.read().find((q) => q.id === id && q.eventId === eventId);
    },
    async add(eventId, authorId, text) {
      const question: EventQuestion = { id: `que_${randomUUID()}`, eventId, authorId, text, createdAt: new Date().toISOString() };
      await store.update((items) => [...items, question]);
      return question;
    },
    async answer(id, text) {
      await store.update((items) => items.map((q) => (q.id === id ? { ...q, answer: { text, at: new Date().toISOString() } } : q)));
    },
    async hide(id) {
      await store.update((items) => items.map((q) => (q.id === id ? { ...q, hidden: true } : q)));
    },
    async remove(id) {
      await store.update((items) => items.filter((q) => q.id !== id));
    },
    async removeOf(memberId) {
      await store.update((items) => items.filter((q) => q.authorId !== memberId));
    },
  };
}

function pgQuestions(): QuestionStore {
  const toQuestion = (r: Record<string, unknown>, eventId: string): EventQuestion => ({
    id: r.id as string,
    eventId,
    authorId: r.author as string,
    text: r.body as string,
    createdAt: iso(r.created_at),
    answer: r.answer ? { text: r.answer as string, at: iso(r.answered_at) } : undefined,
    hidden: (r.hidden as boolean) || undefined,
  });
  const select = (db: Sql) => db`
    select q.id::text, a.legacy_id as author, q.body, q.answer, q.answered_at, q.hidden, q.created_at
    from app.event_questions q join app.members a on a.id = q.author_id`;
  return {
    async ofEvent(eventId) {
      const db = sql();
      return (await db`${select(db)} where q.event_id = ${eventRow(db, eventId)}`).map((r) => toQuestion(r, eventId));
    },
    async find(id, eventId) {
      const db = sql();
      const [row] = await db`${select(db)} where q.id::text = ${id} and q.event_id = ${eventRow(db, eventId)}`;
      return row ? toQuestion(row, eventId) : undefined;
    },
    async add(eventId, authorId, text) {
      const db = sql();
      const [row] = await db`
        insert into app.event_questions (event_id, author_id, body) values (${eventRow(db, eventId)}, ${memberRow(db, authorId)}, ${text})
        returning id::text, created_at`;
      return { id: row.id, eventId, authorId, text, createdAt: iso(row.created_at) };
    },
    async answer(id, text) {
      await sql()`update app.event_questions set answer = ${text}, answered_at = now() where id::text = ${id}`;
    },
    async hide(id) {
      await sql()`update app.event_questions set hidden = true where id::text = ${id}`;
    },
    async remove(id) {
      await sql()`delete from app.event_questions where id::text = ${id}`;
    },
    async removeOf(memberId) {
      const db = sql();
      await db`delete from app.event_questions where author_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const questionStore: QuestionStore = USE_POSTGRES ? pgQuestions() : jsonQuestions();

/* ---------- อยากเจออีก ---------- */

interface MeetAgainStore {
  ofEvent(eventId: string): Promise<MeetAgainPick[]>;
  isMutual(a: string, b: string): Promise<boolean>;
  set(eventId: string, fromId: string, toId: string, want: boolean): Promise<void>;
  removeOf(memberId: string): Promise<void>;
}

function jsonMeetAgain(): MeetAgainStore {
  const store = createJsonStore<MeetAgainPick>('meet_again');
  return {
    async ofEvent(eventId) {
      return store.read().filter((p) => p.eventId === eventId);
    },
    async isMutual(a, b) {
      const picks = store.read();
      return picks.some((p) => p.fromId === a && p.toId === b && picks.some((q) => q.eventId === p.eventId && q.fromId === b && q.toId === a));
    },
    async set(eventId, fromId, toId, want) {
      await store.update((items) => {
        const rest = items.filter((p) => !(p.eventId === eventId && p.fromId === fromId && p.toId === toId));
        return want ? [...rest, { eventId, fromId, toId, at: new Date().toISOString() }] : rest;
      });
    },
    async removeOf(memberId) {
      await store.update((items) => items.filter((p) => p.fromId !== memberId && p.toId !== memberId));
    },
  };
}

function pgMeetAgain(): MeetAgainStore {
  return {
    async ofEvent(eventId) {
      const db = sql();
      const rows = await db`
        select f.legacy_id as from_id, t.legacy_id as to_id, p.created_at
        from app.meet_again_picks p join app.members f on f.id = p.from_id join app.members t on t.id = p.to_id
        where p.event_id = ${eventRow(db, eventId)}`;
      return rows.map((r) => ({ eventId, fromId: r.from_id, toId: r.to_id, at: iso(r.created_at) }));
    },
    async isMutual(a, b) {
      const db = sql();
      const rows = await db`
        select 1 from app.meet_again_picks x join app.meet_again_picks y on y.event_id = x.event_id and y.from_id = x.to_id and y.to_id = x.from_id
        where x.from_id = ${memberRow(db, a)} and x.to_id = ${memberRow(db, b)} limit 1`;
      return rows.length > 0;
    },
    async set(eventId, fromId, toId, want) {
      const db = sql();
      if (want) {
        await db`insert into app.meet_again_picks (event_id, from_id, to_id) values (${eventRow(db, eventId)}, ${memberRow(db, fromId)}, ${memberRow(db, toId)}) on conflict do nothing`;
      } else {
        await db`delete from app.meet_again_picks where event_id = ${eventRow(db, eventId)} and from_id = ${memberRow(db, fromId)} and to_id = ${memberRow(db, toId)}`;
      }
    },
    async removeOf(memberId) {
      const db = sql();
      await db`delete from app.meet_again_picks where from_id = ${memberRow(db, memberId)} or to_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const meetAgainStore: MeetAgainStore = USE_POSTGRES ? pgMeetAgain() : jsonMeetAgain();

/* ---------- Groups inside an อีเวนต์ ---------- */

interface FairGroupStore {
  find(id: string): Promise<FairGroup | null>;
  ofFair(fairId: string): Promise<FairGroup[]>;
  ofMember(memberId: string): Promise<FairGroup[]>;
  add(group: FairGroup): Promise<void>;
  /** The seat check and the write are one step, so the last seat cannot go twice */
  join(groupId: string, memberId: string): Promise<'ok' | 'full' | 'missing'>;
  leave(groupId: string, memberId: string): Promise<void>;
  close(groupId: string): Promise<void>;
  removeOf(memberId: string): Promise<void>;
}

function jsonFairGroups(): FairGroupStore {
  const store = createJsonStore<FairGroup>('fair_groups');
  return {
    async find(id) {
      return store.read().find((g) => g.id === id) ?? null;
    },
    async ofFair(fairId) {
      return store.read().filter((g) => g.fairId === fairId);
    },
    async ofMember(memberId) {
      return store.read().filter((g) => g.memberIds.includes(memberId));
    },
    async add(group) {
      await store.update((items) => [group, ...items]);
    },
    async join(groupId, memberId) {
      let result: 'ok' | 'full' | 'missing' = 'missing';
      await store.update((items) =>
        items.map((g) => {
          if (g.id !== groupId) return g;
          if (g.memberIds.includes(memberId)) {
            result = 'ok';
            return g;
          }
          if (g.memberIds.length >= g.maxMembers) {
            result = 'full';
            return g;
          }
          result = 'ok';
          return { ...g, memberIds: [...g.memberIds, memberId] };
        })
      );
      return result;
    },
    async leave(groupId, memberId) {
      await store.update((items) => items.map((g) => (g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== memberId) } : g)));
    },
    async close(groupId) {
      await store.update((items) => items.filter((g) => g.id !== groupId));
    },
    async removeOf(memberId) {
      await store.update((items) => items.filter((g) => g.creatorId !== memberId).map((g) => (g.memberIds.includes(memberId) ? { ...g, memberIds: g.memberIds.filter((id) => id !== memberId) } : g)));
    },
  };
}

function pgFairGroups(): FairGroupStore {
  const toGroup = (r: Record<string, unknown>): FairGroup => ({
    id: r.legacy_id as string,
    fairId: r.fair as string,
    title: r.title as string,
    meetupPoint: r.meetup_point as string,
    time: r.meet_time as string,
    note: r.note as string,
    maxMembers: r.max_members as number,
    creatorId: r.creator as string,
    memberIds: r.member_ids as string[],
    createdAt: iso(r.created_at),
  });
  const select = (db: Sql) => db`
    select g.legacy_id, e.slug as fair, g.title, g.meetup_point, g.meet_time, g.note, g.max_members, c.legacy_id as creator, g.created_at,
      array(select m.legacy_id from app.fair_group_members gm join app.members m on m.id = gm.member_id where gm.group_id = g.id order by gm.joined_at) as member_ids
    from app.fair_groups g join app.events e on e.id = g.event_id join app.members c on c.id = g.creator_id`;
  return {
    async find(id) {
      const db = sql();
      const [row] = await db`${select(db)} where g.legacy_id = ${id}`;
      return row ? toGroup(row) : null;
    },
    async ofFair(fairId) {
      const db = sql();
      return (await db`${select(db)} where e.slug = ${fairId} order by g.created_at desc`).map(toGroup);
    },
    async ofMember(memberId) {
      const db = sql();
      return (await db`${select(db)} where g.id in (select gm.group_id from app.fair_group_members gm where gm.member_id = ${memberRow(db, memberId)}) order by g.created_at desc`).map(toGroup);
    },
    async add(group) {
      await sql().begin(async (tx) => {
        const [row] = await tx`
          insert into app.fair_groups (legacy_id, event_id, creator_id, title, meetup_point, meet_time, note, max_members, members_count)
          values (${group.id}, ${eventRow(tx, group.fairId)}, ${memberRow(tx, group.creatorId)}, ${group.title}, ${group.meetupPoint}, ${group.time}, ${group.note}, ${group.maxMembers}, 1)
          returning id`;
        await tx`insert into app.fair_group_members (group_id, member_id) values (${row.id}, ${memberRow(tx, group.creatorId)})`;
      });
    },
    async join(groupId, memberId) {
      return sql().begin(async (tx) => {
        const [group] = await tx`select id, members_count, max_members from app.fair_groups where legacy_id = ${groupId} for update`;
        if (!group) return 'missing' as const;
        const [already] = await tx`select 1 from app.fair_group_members where group_id = ${group.id} and member_id = ${memberRow(tx, memberId)}`;
        if (already) return 'ok' as const;
        if (group.members_count >= group.max_members) return 'full' as const;
        await tx`insert into app.fair_group_members (group_id, member_id) values (${group.id}, ${memberRow(tx, memberId)})`;
        await tx`update app.fair_groups set members_count = members_count + 1 where id = ${group.id}`;
        return 'ok' as const;
      }) as Promise<'ok' | 'full' | 'missing'>;
    },
    async leave(groupId, memberId) {
      await sql().begin(async (tx) => {
        const gone = await tx`
          delete from app.fair_group_members
          where group_id = (select id from app.fair_groups where legacy_id = ${groupId}) and member_id = ${memberRow(tx, memberId)} returning group_id`;
        if (gone.length) await tx`update app.fair_groups set members_count = members_count - 1 where legacy_id = ${groupId}`;
      });
    },
    async close(groupId) {
      await sql()`delete from app.fair_groups where legacy_id = ${groupId}`;
    },
    async removeOf(memberId) {
      await sql().begin(async (tx) => {
        await tx`delete from app.fair_groups where creator_id = ${memberRow(tx, memberId)}`;
        const left = await tx`delete from app.fair_group_members where member_id = ${memberRow(tx, memberId)} returning group_id`;
        for (const row of left) await tx`update app.fair_groups set members_count = members_count - 1 where id = ${row.group_id}`;
      });
    },
  };
}

export const fairGroupStore: FairGroupStore = USE_POSTGRES ? pgFairGroups() : jsonFairGroups();

/* ---------- Safety reports ---------- */

interface ContentReportStore {
  /** Newest first */
  all(): Promise<ContentReport[]>;
  add(report: Omit<ContentReport, 'id' | 'createdAt' | 'status'>): Promise<ContentReport>;
  /** Closes one report if it is open, and returns it */
  close(id: string, closedBy: string, note?: string): Promise<ContentReport | null>;
  /** Closes every open report about one target */
  closeTarget(targetId: string, closedBy: string, note: string): Promise<void>;
  removeBy(memberId: string): Promise<void>;
}

function jsonContentReports(): ContentReportStore {
  const store = createJsonStore<ContentReport>('content_reports');
  return {
    async all() {
      return store.read();
    },
    async add(report) {
      const saved: ContentReport = { ...report, id: `rep_${randomUUID()}`, createdAt: new Date().toISOString(), status: 'open' };
      await store.update((items) => [saved, ...items]);
      return saved;
    },
    async close(id, closedBy, note) {
      let closed: ContentReport | null = null;
      await store.update((items) => items.map((r) => {
        if (r.id !== id || r.status === 'closed') return r;
        closed = { ...r, status: 'closed', closedAt: new Date().toISOString(), closedBy, note };
        return closed;
      }));
      return closed;
    },
    async closeTarget(targetId, closedBy, note) {
      const closedAt = new Date().toISOString();
      await store.update((items) => items.map((r) => (r.targetId === targetId && r.status === 'open' ? { ...r, status: 'closed' as const, closedAt, closedBy, note } : r)));
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((r) => r.reporterId !== memberId));
    },
  };
}

function pgContentReports(): ContentReportStore {
  const toReport = (r: Record<string, unknown>): ContentReport => ({
    id: r.id as string,
    targetType: r.target_type as ContentReport['targetType'],
    targetId: r.target_id as string,
    targetTitle: (r.target_title as string | null) ?? '',
    hostMemberId: (r.host as string | null) ?? undefined,
    excerpt: (r.excerpt as string | null) ?? undefined,
    roomId: (r.room_id as string | null) ?? undefined,
    reason: r.reason as string,
    details: r.details as string,
    reporterId: (r.reporter as string | null) ?? '',
    createdAt: iso(r.created_at),
    status: r.status as ContentReport['status'],
    closedAt: isoOrNone(r.closed_at),
    closedBy: (r.closed_by_label as string | null) ?? undefined,
    note: (r.note as string | null) ?? undefined,
  });
  const select = (db: Sql) => db`
    select r.id::text, r.target_type, r.target_id, r.target_title, h.legacy_id as host, r.excerpt, r.room_id, r.reason, r.details,
      p.legacy_id as reporter, r.created_at, r.status, r.closed_at, r.closed_by_label, r.note
    from app.content_reports r
    left join app.members h on h.id = r.host_member_id
    left join app.members p on p.id = r.reporter_id
    where r.target_type in ('community', 'fair', 'spot', 'review', 'chat_message', 'comment')`;
  return {
    async all() {
      const db = sql();
      return (await db`${select(db)} order by r.created_at desc`).map(toReport);
    },
    async add(report) {
      const db = sql();
      const [row] = await db`
        insert into app.content_reports (target_type, target_id, target_title, host_member_id, room_id, reporter_id, reason, details, excerpt)
        values (${report.targetType}, ${report.targetId}, ${report.targetTitle}, ${report.hostMemberId ? memberRow(db, report.hostMemberId) : db`null::uuid`},
          ${report.roomId ?? null}, ${memberRow(db, report.reporterId)}, ${report.reason}, ${report.details}, ${report.excerpt ?? null})
        returning id::text, created_at`;
      return { ...report, id: row.id, createdAt: iso(row.created_at), status: 'open' };
    },
    async close(id, closedBy, note) {
      const db = sql();
      const rows = await db`
        update app.content_reports set status = 'closed', closed_at = now(), closed_by_label = ${closedBy}, note = ${note ?? null}
        where id::text = ${id} and status = 'open' returning id`;
      if (rows.length === 0) return null;
      const [row] = await db`${select(db)} and r.id::text = ${id}`;
      return row ? toReport(row) : null;
    },
    async closeTarget(targetId, closedBy, note) {
      await sql()`
        update app.content_reports set status = 'closed', closed_at = now(), closed_by_label = ${closedBy}, note = ${note}
        where target_id = ${targetId} and status = 'open' and target_type in ('review', 'chat_message', 'comment')`;
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.content_reports where reporter_id = ${memberRow(db, memberId)} and target_type in ('community', 'fair', 'spot', 'review', 'chat_message')`;
    },
  };
}

export const contentReportStore: ContentReportStore = USE_POSTGRES ? pgContentReports() : jsonContentReports();
