import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { momentRepository } from '@/lib/moments';
import { isRateLimited } from '@/lib/rateLimit';
import { finishedAtOf } from '@/lib/social/questFinishes';
import { joinsOf } from '@/lib/social/questJoins';
import { addDays, bangkokDay, planStatus, stampProblem } from '@/lib/social/questPlan';
import { rewardsOf } from '@/lib/social/rewardsLedger';
import { questStampStore } from '@/lib/social/questStampStore';
import type { Member } from '@/lib/members/types';

type Context = { params: Promise<{ id: string }> };
const noStore = { 'Cache-Control': 'private, no-store' };
const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status, headers: noStore });

/** The member's plan for this challenge: when it started, the stamps, and where they stand today; null when not joined */
async function planState(member: Member, questId: string) {
  const quest = await db.findQuestById(questId);
  if (!quest?.plan) return { quest, state: null };
  const join = (await joinsOf(member.id)).find((item) => item.questId === quest.id);
  if (!join) return { quest, state: null };
  const stamps = await questStampStore.stamps({ memberId: member.id, questId: quest.id });
  const start = bangkokDay(join.joinedAt);
  return { quest, state: { start, stamps: stamps.map(({ day, momentId }) => ({ day, ...(momentId ? { momentId } : {}) })), status: planStatus(quest.plan, start, stamps.map((s) => s.day)) } };
}

/** today, or yesterday while it can still be stamped */
const pickDay = (value: unknown) => (value === 'yesterday' ? addDays(bangkokDay(), -1) : bangkokDay());

// GET → { state: { start, stamps: [{ day, momentId? }], status } | null }: the signed-in member's plan (docs/API.md)
export async function GET(request: Request, context: Context) {
  const member = await getSessionMember(request);
  if (!member) return fail('กรุณาเข้าสู่ระบบ', 401);
  const { quest, state } = await planState(member, (await context.params).id);
  if (!quest) return fail('ไม่พบชาเลนจ์นี้', 404);
  return NextResponse.json({ success: true, state }, { headers: noStore });
}

// POST { day?: 'today' | 'yesterday' } → stamps that day; { state, finished } (finished: this stamp completed the challenge)
export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return fail('Forbidden', 403);
  const member = await getSessionMember(request);
  if (!member) return fail('กรุณาเข้าสู่ระบบ', 401);
  if (member.status !== 'active') return fail('บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้', 403);
  if (await isRateLimited(`quest-stamp:${member.id}`, 60, 60 * 60 * 1000)) return fail('ทำรายการบ่อยเกินไป กรุณารอสักครู่', 429);
  const questId = (await context.params).id;
  const { quest, state } = await planState(member, questId);
  if (!quest) return fail('ไม่พบชาเลนจ์นี้', 404);
  if (!quest.plan || !state) return fail('เข้าร่วมชาเลนจ์นี้ก่อน แล้วค่อย stamp นะ', 409);
  const body = await request.json().catch(() => ({}));
  const day = pickDay(body?.day);
  const problem = stampProblem(quest.plan, state.start, state.stamps.map((s) => s.day), day);
  if (problem) return fail(problem, 409);
  await questStampStore.add(member.id, quest.id, day);
  // Records the finish (XP, badge, notification) when this stamp completes the plan
  await rewardsOf(member.id);
  const after = await planState(member, questId);
  return NextResponse.json({ success: true, state: after.state, finished: Boolean(after.state?.status.finished && !state.status.finished) }, { headers: noStore });
}

// DELETE { day: 'today' | 'yesterday' } → takes back a stamp made by mistake; only days that can still be stamped
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return fail('Forbidden', 403);
  const member = await getSessionMember(request);
  if (!member) return fail('กรุณาเข้าสู่ระบบ', 401);
  const questId = (await context.params).id;
  const { state } = await planState(member, questId);
  if (!state) return fail('เข้าร่วมชาเลนจ์นี้ก่อนนะ', 409);
  // A finished challenge keeps its stamps: they are what it was finished with (the finish and its XP stay recorded)
  if (await finishedAtOf(member.id, questId)) return fail('ชาเลนจ์นี้สำเร็จแล้ว stamp จึงยกเลิกไม่ได้', 409);
  const body = await request.json().catch(() => ({}));
  await questStampStore.remove(member.id, questId, pickDay(body?.day));
  return NextResponse.json({ success: true, state: (await planState(member, questId)).state }, { headers: noStore });
}

// PATCH { day: 'today' | 'yesterday', momentId } → links the moment the member shared for that day's stamp
export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return fail('Forbidden', 403);
  const member = await getSessionMember(request);
  if (!member) return fail('กรุณาเข้าสู่ระบบ', 401);
  const body = await request.json().catch(() => ({}));
  const momentId = typeof body?.momentId === 'string' ? body.momentId.slice(0, 120) : '';
  const moment = momentId ? await momentRepository.findById(momentId) : null;
  if (!moment || moment.authorId !== member.id) return fail('ไม่พบโมเมนต์นี้', 404);
  await questStampStore.attachMoment(member.id, (await context.params).id, pickDay(body?.day), momentId);
  return NextResponse.json({ success: true }, { headers: noStore });
}
