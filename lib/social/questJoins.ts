import { db } from '../db';
import { questMemberStore } from './stores';
import { questStampStore } from './questStampStore';

/**
 * Which challenges a member has joined, kept with the account (lib/social/stores.ts).
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

export const joinsOf = async (memberId: string) =>
  (await questMemberStore.joins({ memberId })).map(({ questId, joinedAt }) => ({ questId, joinedAt }));

export const joinedQuestIdsOf = async (memberId: string): Promise<string[]> => (await joinsOf(memberId)).map((join) => join.questId);

/** Who joined one challenge, in the order they joined */
export const joinersOf = async (questId: string) =>
  (await questMemberStore.joins({ questId })).map(({ memberId, joinedAt }) => ({ memberId, joinedAt })).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

/** Every join, for the home page's live activity */
export const allQuestJoins = (): Promise<QuestJoin[]> => questMemberStore.joins();

/** Members who joined each challenge */
export const joinCounts = (): Promise<Map<string, number>> => questMemberStore.joinCounts();

/** Only a running challenge can be joined; joining twice changes nothing */
export async function joinQuest(memberId: string, questId: string): Promise<void> {
  const quest = await db.findQuestById(questId);
  if (!quest || quest.status === 'draft') throw new QuestJoinError('ไม่พบชาเลนจ์นี้', 404);
  if (quest.status === 'ended') throw new QuestJoinError('ชาเลนจ์นี้จบไปแล้ว ลองดูชาเลนจ์อื่นที่ยังเปิดอยู่นะ', 409);
  await questMemberStore.join(memberId, questId);
}

export async function leaveQuest(memberId: string, questId: string): Promise<void> {
  await questMemberStore.leave(memberId, questId);
}

/** Account deletion */
export async function removeQuestJoinsBy(memberId: string): Promise<void> {
  await questMemberStore.removeBy(memberId);
  await questStampStore.removeBy(memberId);
}
