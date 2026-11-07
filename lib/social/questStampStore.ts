import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { createJsonStore } from './jsonStore';

const memberRow = (tx: Sql, id: string) => tx`(select id from app.members where legacy_id = ${id})`;
const questRow = (tx: Sql, id: string) => tx`(select id from app.quests where slug = ${id})`;
const iso = (value: unknown) => new Date(value as string).toISOString();

/* ---------- Plan stamps (challenges done by plan, lib/social/questPlan.ts) ---------- */

export interface QuestStamp {
  memberId: string;
  questId: string;
  /** Thai date, "YYYY-MM-DD" */
  day: string;
  /** The moment shared for that day, when there is one */
  momentId?: string;
  createdAt: string;
}

interface QuestStampStore {
  stamps(filter: { memberId: string; questId?: string }): Promise<QuestStamp[]>;
  /** False when that day was already stamped */
  add(memberId: string, questId: string, day: string): Promise<boolean>;
  remove(memberId: string, questId: string, day: string): Promise<void>;
  attachMoment(memberId: string, questId: string, day: string, momentId: string): Promise<void>;
  removeBy(memberId: string): Promise<void>;
}

function jsonQuestStamps(): QuestStampStore {
  const store = createJsonStore<QuestStamp>('quest_stamps');
  const same = (a: QuestStamp, memberId: string, questId: string, day: string) => a.memberId === memberId && a.questId === questId && a.day === day;
  return {
    async stamps({ memberId, questId }) {
      return store.read().filter((st) => st.memberId === memberId && (!questId || st.questId === questId)).sort((a, b) => a.day.localeCompare(b.day));
    },
    async add(memberId, questId, day) {
      let added = false;
      await store.update((items) => {
        if (items.some((st) => same(st, memberId, questId, day))) return items;
        added = true;
        return [...items, { memberId, questId, day, createdAt: new Date().toISOString() }];
      });
      return added;
    },
    async remove(memberId, questId, day) {
      await store.update((items) => items.filter((st) => !same(st, memberId, questId, day)));
    },
    async attachMoment(memberId, questId, day, momentId) {
      await store.update((items) => items.map((st) => (same(st, memberId, questId, day) ? { ...st, momentId } : st)));
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((st) => st.memberId !== memberId));
    },
  };
}

function pgQuestStamps(): QuestStampStore {
  return {
    async stamps({ memberId, questId }) {
      const db = sql();
      const rows = await db`
        select q.slug as quest, s.day::text as day, mo.slug as moment, s.created_at
        from app.quest_stamps s join app.quests q on q.id = s.quest_id left join app.moments mo on mo.id = s.moment_id
        where s.member_id = ${memberRow(db, memberId)} ${questId ? db`and q.slug = ${questId}` : db``}
        order by s.day`;
      return rows.map((r) => ({ memberId, questId: r.quest, day: r.day, ...(r.moment ? { momentId: r.moment } : {}), createdAt: iso(r.created_at) }));
    },
    async add(memberId, questId, day) {
      const db = sql();
      const rows = await db`
        insert into app.quest_stamps (quest_id, member_id, day) values (${questRow(db, questId)}, ${memberRow(db, memberId)}, ${day}::date)
        on conflict do nothing returning day`;
      return rows.length > 0;
    },
    async remove(memberId, questId, day) {
      const db = sql();
      await db`delete from app.quest_stamps where quest_id = ${questRow(db, questId)} and member_id = ${memberRow(db, memberId)} and day = ${day}::date`;
    },
    async attachMoment(memberId, questId, day, momentId) {
      const db = sql();
      await db`
        update app.quest_stamps set moment_id = (select id from app.moments where slug = ${momentId})
        where quest_id = ${questRow(db, questId)} and member_id = ${memberRow(db, memberId)} and day = ${day}::date`;
    },
    async removeBy(memberId) {
      const db = sql();
      await db`delete from app.quest_stamps where member_id = ${memberRow(db, memberId)}`;
    },
  };
}

export const questStampStore: QuestStampStore = USE_POSTGRES ? pgQuestStamps() : jsonQuestStamps();
