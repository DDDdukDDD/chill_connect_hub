import { randomUUID } from 'node:crypto';
import { isEventEnded } from '../dateUtils';
import { bangkokYmd, fairGroupDayLabel, fairGroupDays } from '../fairGroupDays';
import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import { guardOrganizer } from '../members/submissions';
import { FAMILY_ALREADY_IN_MESSAGE, familyAlreadyIn } from '../members/subAccounts';
import type { Member } from '../members/types';
import { fairGroupStore } from './stores';
import { guardMemberText } from './textRules';

/** A small group of members who agree to walk a fair together: a time and a meeting point inside a public venue */
export interface FairGroup {
  id: string;
  fairId: string;
  title: string;
  meetupPoint: string;
  /** "YYYY-MM-DD" in Bangkok (BE-386); none on groups made before */
  date?: string;
  time: string;
  note: string;
  maxMembers: number;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
}

const MAX_GROUPS_PER_MEMBER_PER_FAIR = 2;
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export const fairGroupById = (groupId: string) => fairGroupStore.find(groupId);

export async function fairGroupsOf(fairId: string, viewer: Member | null) {
  const blocked = new Set(viewer?.blockedIds ?? []);
  const result = [];
  const today = bangkokYmd();
  // A group whose day has passed is gone for everyone but its people; the soonest day first
  const groups = (await fairGroupStore.ofFair(fairId))
    .filter((g) => !blocked.has(g.creatorId) && (!g.date || g.date >= today || Boolean(viewer && g.memberIds.includes(viewer.id))))
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const creators = await memberRepository.findByIds(groups.map((g) => g.creatorId));
  for (const group of groups) {
    const creator = creators.get(group.creatorId);
    if (!creator || creator.status !== 'active') continue;
    result.push({
      id: group.id,
      title: group.title,
      meetupPoint: group.meetupPoint,
      ...(group.date ? { date: group.date, dateLabel: fairGroupDayLabel(group.date) } : {}),
      time: group.time,
      note: group.note,
      maxMembers: group.maxMembers,
      currentMembers: group.memberIds.length,
      creator: { id: creator.id, displayName: tidyDisplayName(creator.displayName).trim() || creator.displayName, avatarUrl: creator.avatarUrl ?? '' },
      isJoined: Boolean(viewer && group.memberIds.includes(viewer.id)),
      isMine: viewer?.id === group.creatorId,
    });
  }
  return result;
}

async function requireOpenFair(fairId: string) {
  const fair = await db.findEventById(fairId);
  if (!fair || fair.approvalStatus !== 'approved' || fair.eventType !== 'public_venue') throw new MemberAuthError('ไม่พบงานนี้', 404);
  if (isEventEnded(fair)) throw new MemberAuthError('งานนี้จบแล้ว จึงเปิดหรือเข้ากลุ่มไม่ได้', 409);
  return fair;
}

export async function createFairGroup(member: Member, fairId: string, input: Record<string, unknown>): Promise<FairGroup> {
  guardOrganizer(member);
  const fair = await requireOpenFair(fairId);
  const title = clean(input.title, 80);
  const meetupPoint = clean(input.meetupPoint, 120);
  const time = clean(input.time, 40);
  const note = clean(input.note, 300);
  if (title.length < 5) throw new MemberAuthError('ตั้งชื่อกลุ่มอย่างน้อย 5 ตัวอักษร');
  if (!meetupPoint) throw new MemberAuthError('บอกจุดนัดพบในงานด้วยนะ');
  if (!time) throw new MemberAuthError('บอกเวลานัดด้วยนะ');
  // The day: one of the fair's days still ahead; a one-day fair takes its day without asking
  const days = fairGroupDays(fair);
  const asked = typeof input.date === 'string' ? input.date : '';
  const date = days.includes(asked) ? asked : days.length === 1 ? days[0] : '';
  if (days.length > 0 && !date) throw new MemberAuthError('เลือกวันที่ไปงานด้วยนะ');
  const maxMembers = Math.min(15, Math.max(2, Math.round(Number(input.maxMembers)) || 4));
  await guardMemberText(member, `${title} ${meetupPoint} ${note}`, 'กลุ่มในอีเวนต์');
  if ((await fairGroupStore.ofFair(fairId)).filter((g) => g.creatorId === member.id).length >= MAX_GROUPS_PER_MEMBER_PER_FAIR) {
    throw new MemberAuthError(`เปิดได้ ${MAX_GROUPS_PER_MEMBER_PER_FAIR} กลุ่มต่องาน ลบกลุ่มเก่าก่อนนะ`, 429);
  }
  const group: FairGroup = { id: `grp_${randomUUID()}`, fairId, title, meetupPoint, ...(date ? { date } : {}), time, note, maxMembers, creatorId: member.id, memberIds: [member.id], createdAt: new Date().toISOString() };
  await fairGroupStore.add(group);
  return group;
}

export async function joinFairGroup(member: Member, groupId: string): Promise<FairGroup> {
  const found = await fairGroupById(groupId);
  if (!found) throw new MemberAuthError('ไม่พบกลุ่มนี้', 404);
  await requireOpenFair(found.fairId);
  await guardMemberText(member, '', 'กลุ่มในอีเวนต์');
  // One person, one seat in a group (BE-393)
  if (await familyAlreadyIn(member, found.memberIds)) throw new MemberAuthError(FAMILY_ALREADY_IN_MESSAGE, 409);
  const outcome = await fairGroupStore.join(groupId, member.id);
  const result = outcome === 'ok' ? await fairGroupById(groupId) : null;
  if (!result) throw new MemberAuthError(outcome === 'full' ? 'กลุ่มนี้เต็มแล้ว' : 'ไม่พบกลุ่มนี้', outcome === 'full' ? 409 : 404);
  return result;
}

/** Leaving one's own group closes it for everyone */
export async function leaveFairGroup(member: Member, groupId: string): Promise<{ closed: boolean }> {
  const found = await fairGroupById(groupId);
  if (!found || !found.memberIds.includes(member.id)) throw new MemberAuthError('คุณไม่ได้อยู่ในกลุ่มนี้', 404);
  const closed = found.creatorId === member.id;
  if (closed) await fairGroupStore.close(groupId);
  else await fairGroupStore.leave(groupId, member.id);
  return { closed };
}

export async function myFairGroups(memberId: string) {
  const result = [];
  for (const group of await fairGroupStore.ofMember(memberId)) {
    const fair = await db.findEventById(group.fairId);
    result.push({ id: group.id, fairId: group.fairId, fairTitle: fair?.title ?? '', title: group.title, ...(group.date ? { date: group.date, dateLabel: fairGroupDayLabel(group.date) } : {}), time: group.time, meetupPoint: group.meetupPoint, isMine: group.creatorId === memberId });
  }
  return result;
}

/** Account deletion: groups the member opened are closed; they leave the others */
export async function removeFairGroupsOf(memberId: string): Promise<void> {
  await fairGroupStore.removeOf(memberId);
}
