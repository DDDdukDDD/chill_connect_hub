import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { guardPosting } from '../members/safety';
import { thaiTimeAgo } from '../moments/service';
import { createJsonStore } from './jsonStore';
import { notifyQuestion } from './notifications';

/**
 * "ถามผู้จัดก่อนไป" (owner 2026-10-23, from Partiful/Meetup): public questions on a ตี้, answered by its host.
 * Everyone can read them (they are on the page for visitors and search engines); asking needs a verified member,
 * answering is the host's. Text follows the comment rules (no links or phone numbers for new accounts).
 */
interface EventQuestion {
  id: string;
  eventId: string;
  authorId: string;
  text: string;
  createdAt: string;
  answer?: { text: string; at: string };
  hidden?: boolean;
}

const store = createJsonStore<EventQuestion>('event_questions');
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
  const list = store.read().filter((q) => q.eventId === eventId && !q.hidden && !blocked.has(q.authorId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const host = hostOf(event as { createdByMemberId?: string });
  const people = new Map<string, Member | null>();
  for (const id of new Set(list.map((q) => q.authorId))) people.set(id, await memberRepository.findById(id));
  const hostMember = host ? await memberRepository.findById(host) : null;
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
  if (store.read().filter((q) => q.eventId === eventId).length >= MAX_PER_EVENT) throw new MemberAuthError('ตี้นี้มีคำถามเยอะแล้ว ลองทักในแชตกลุ่มหลังลงทะเบียน', 409);
  const question: EventQuestion = { id: `que_${randomUUID()}`, eventId, authorId: member.id, text, createdAt: new Date().toISOString() };
  await store.update((items) => [...items, question]);
  if (host) await notifyQuestion(host, member, eventId, 'question', text);
  return question;
}

export async function answerQuestion(member: Member, eventId: string, questionId: unknown, input: unknown) {
  const event = await communityEvent(eventId);
  if (hostOf(event as { createdByMemberId?: string }) !== member.id) throw new MemberAuthError('ตอบได้เฉพาะคนจัดตี้นี้', 403);
  const question = store.read().find((q) => q.id === questionId && q.eventId === eventId);
  if (!question) throw new MemberAuthError('ไม่พบคำถามนี้', 404);
  const text = clean(input);
  if (!text) throw new MemberAuthError('พิมพ์คำตอบก่อนนะ');
  await guardPosting(member, 'comment', text);
  await store.update((items) => items.map((q) => (q.id === question.id ? { ...q, answer: { text, at: new Date().toISOString() } } : q)));
  await notifyQuestion(question.authorId, member, eventId, 'answer', text);
}

/** The asker removes their own question, or the host hides one on their ตี้ */
export async function removeQuestion(member: Member, eventId: string, questionId: unknown) {
  const event = await communityEvent(eventId);
  const question = store.read().find((q) => q.id === questionId && q.eventId === eventId);
  if (!question) throw new MemberAuthError('ไม่พบคำถามนี้', 404);
  const isHost = hostOf(event as { createdByMemberId?: string }) === member.id;
  if (question.authorId !== member.id && !isHost) throw new MemberAuthError('ลบได้เฉพาะคำถามของตัวเอง', 403);
  await store.update((items) => (question.authorId === member.id ? items.filter((q) => q.id !== question.id) : items.map((q) => (q.id === question.id ? { ...q, hidden: true } : q))));
}

export async function removeQuestionsOf(memberId: string): Promise<void> {
  await store.update((items) => items.filter((q) => q.authorId !== memberId));
}
