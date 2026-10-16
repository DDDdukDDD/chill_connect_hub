import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { createJsonStore } from './jsonStore';

/**
 * Which challenges a member has joined, kept with the account (data/quest_joins.json, gitignored).
 * Joining is the member saying "I am doing this one": it puts the challenge in My Hub, counts them among
 * its participants, and is what makes its reward theirs when they finish (lib/social/questProgress.ts).
 * Progress itself is not stored here; it is counted from visits.
 */
export interface QuestJoin {
  id: string;
  memberId: string;
  questId: string;
  joinedAt: string;
}

export class QuestJoinError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const store = createJsonStore<QuestJoin>('quest_joins');

export const joinsOf = (memberId: string) =>
  store.read().filter((join) => join.memberId === memberId).map(({ questId, joinedAt }) => ({ questId, joinedAt }));

export const joinedQuestIdsOf = (memberId: string): string[] => joinsOf(memberId).map((join) => join.questId);

/** Who joined one challenge, in the order they joined */
export const joinersOf = (questId: string) =>
  store.read().filter((join) => join.questId === questId).map(({ memberId, joinedAt }) => ({ memberId, joinedAt }));

/** Every join, for the home page's live activity */
export const allQuestJoins = (): readonly QuestJoin[] => store.read();

/** Members who joined each challenge */
export function joinCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const join of store.read()) counts.set(join.questId, (counts.get(join.questId) ?? 0) + 1);
  return counts;
}

/** Only a running challenge can be joined; joining twice changes nothing */
export async function joinQuest(memberId: string, questId: string): Promise<void> {
  const quest = await db.findQuestById(questId);
  if (!quest || quest.status === 'draft') throw new QuestJoinError('ไม่พบชาเลนจ์นี้', 404);
  if (quest.status === 'ended') throw new QuestJoinError('ชาเลนจ์นี้จบไปแล้ว ลองดูชาเลนจ์อื่นที่ยังเปิดอยู่นะ', 409);
  await store.update((items) =>
    items.some((join) => join.memberId === memberId && join.questId === questId)
      ? items
      : [{ id: `qj_${randomUUID()}`, memberId, questId, joinedAt: new Date().toISOString() }, ...items]
  );
}

export async function leaveQuest(memberId: string, questId: string): Promise<void> {
  await store.update((items) => items.filter((join) => !(join.memberId === memberId && join.questId === questId)));
}

/** Account deletion */
export async function removeQuestJoinsBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((join) => join.memberId !== memberId));
}
