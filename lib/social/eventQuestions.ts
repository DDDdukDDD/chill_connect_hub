import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { guardPosting } from '../members/safety';
import { thaiTimeAgo } from '../moments/service';
import { questionStore } from './stores';
import { notifyQuestion } from './notifications';

/**
 * "ถามผู้จัดก่อนไป" (owner 2026-10-23, from Partiful/Meetup): public questions on a ตี้, answered by its host.
 * Everyone can read them (they are on the page for visitors and search engines); asking needs a verified member,
 * answering is the host's. Text follows the comment rules (no links or phone numbers for new accounts).
 */
export interface EventQuestion {
  id: string;
  eventId: string;
  authorId: string;
  text: string;
  createdAt: string;
  answer?: { text: string; at: string };
  hidden?: boolean;
}

export const MAX_QUESTION_LENGTH = 200;
const MAX_PER_EVENT = 100;

const hostOf = (event: { createdByMemberId?: string }) => event.createdByMemberId;
const clean = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUESTION_LENGTH) : '');

async function communityEvent(eventId: string) {
  const event = await db.findEventById(eventId);
  if (!event || event.eventType === 'public_venue') throw new MemberAuthError('ไม่พบตี้นี้', 404);
  return event;
}

/** The questions of a ตี้, newest first, with the host's answers; people the viewer blocked are left out */
export async function questionsOf(eventId: string, viewer: Member | null) {
  const event = await db.findEventById(eventId);
  if (!event) return null;
  const blocked = new Set(viewer?.blockedIds ?? []);
  const list = (await questionStore.ofEvent(eventId)).filter((q) => !q.hidden && !blocked.has(q.authorId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const host = hostOf(event as { createdByMemberId?: string });
  const people = await memberRepository.findByIds([...list.map((q) => q.authorId), ...(host ? [host] : [])]);
  const hostMember = host ? people.get(host) ?? null : null;
  return {
    canAnswer: Boolean(viewer && host === viewer.id),
    hostName: hostMember ? tidyDisplayName(hostMember.displayName).trim() || hostMember.displayName : event.hostName,
    questions: list
      .filter((q) => people.get(q.authorId)?.status === 'active')
      .map((q) => {
        const author = people.get(q.authorId)!;
        return {
          id: q.id,
          authorName: tidyDisplayName(author.displayName).trim() || author.displayName,
          text: q.text,
          timeAgo: thaiTimeAgo(q.createdAt),
          isMine: q.authorId === viewer?.id,
          answer: q.answer ? { text: q.answer.text, timeAgo: thaiTimeAgo(q.answer.at) } : undefined,
        };
      }),
  };
}

export async function askQuestion(member: Member, eventId: string, input: unknown) {
  const event = await communityEvent(eventId);
  const host = hostOf(event as { createdByMemberId?: string });
  if (host === member.id) throw new MemberAuthError('คุณเป็นคนจัดตี้นี้ ตอบคำถามได้เลย');
  const text = clean(input);
  if (text.length < 3) throw new MemberAuthError('พิมพ์คำถามก่อนนะ');
  await guardPosting(member, 'comment', text);
  if ((await questionStore.ofEvent(eventId)).length >= MAX_PER_EVENT) throw new MemberAuthError('ตี้นี้มีคำถามเยอะแล้ว ลองทักในแชตกลุ่มหลังลงทะเบียน', 409);
  const question = await questionStore.add(eventId, member.id, text);
  if (host) await notifyQuestion(host, member, eventId, 'question', text);
  return question;
}

export async function answerQuestion(member: Member, eventId: string, questionId: unknown, input: unknown) {
  const event = await communityEvent(eventId);
  if (hostOf(event as { createdByMemberId?: string }) !== member.id) throw new MemberAuthError('ตอบได้เฉพาะคนจัดตี้นี้', 403);
  const question = await questionStore.find(String(questionId), eventId);
  if (!question) throw new MemberAuthError('ไม่พบคำถามนี้', 404);
  const text = clean(input);
  if (!text) throw new MemberAuthError('พิมพ์คำตอบก่อนนะ');
  await guardPosting(member, 'comment', text);
  await questionStore.answer(question.id, text);
  await notifyQuestion(question.authorId, member, eventId, 'answer', text);
}

/** The asker removes their own question, or the host hides one on their ตี้ */
export async function removeQuestion(member: Member, eventId: string, questionId: unknown) {
  const event = await communityEvent(eventId);
  const question = await questionStore.find(String(questionId), eventId);
  if (!question) throw new MemberAuthError('ไม่พบคำถามนี้', 404);
  const isHost = hostOf(event as { createdByMemberId?: string }) === member.id;
  if (question.authorId !== member.id && !isHost) throw new MemberAuthError('ลบได้เฉพาะคำถามของตัวเอง', 403);
  if (question.authorId === member.id) await questionStore.remove(question.id);
  else await questionStore.hide(question.id);
}

export async function removeQuestionsOf(memberId: string): Promise<void> {
  await questionStore.removeOf(memberId);
}
