import { randomUUID } from 'node:crypto';
import { isEventEnded } from '../dateUtils';
import { db } from '../db';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { createJsonStore } from './jsonStore';
import { guardMemberText } from './textRules';

/** A small group of members who agree to walk a fair together: a time and a meeting point inside a public venue */
export interface FairGroup {
  id: string;
  fairId: string;
  title: string;
  meetupPoint: string;
  time: string;
  note: string;
  maxMembers: number;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
}

const store = createJsonStore<FairGroup>('fair_groups');
const MAX_GROUPS_PER_MEMBER_PER_FAIR = 2;
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export const isFairGroupMember = (groupId: string, memberId: string) => Boolean(store.read().find((g) => g.id === groupId)?.memberIds.includes(memberId));
export const fairGroupById = (groupId: string) => store.read().find((g) => g.id === groupId) ?? null;

export async function fairGroupsOf(fairId: string, viewer: Member | null) {
  const blocked = new Set(viewer?.blockedIds ?? []);
  const result = [];
  for (const group of store.read().filter((g) => g.fairId === fairId && !blocked.has(g.creatorId))) {
    const creator = await memberRepository.findById(group.creatorId);
    if (!creator || creator.status !== 'active') continue;
    result.push({
      id: group.id,
      title: group.title,
      meetupPoint: group.meetupPoint,
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
  await requireOpenFair(fairId);
  const title = clean(input.title, 80);
  const meetupPoint = clean(input.meetupPoint, 120);
  const time = clean(input.time, 40);
  const note = clean(input.note, 300);
  if (title.length < 5) throw new MemberAuthError('ตั้งชื่อกลุ่มอย่างน้อย 5 ตัวอักษร');
  if (!meetupPoint) throw new MemberAuthError('บอกจุดนัดพบในงานด้วยนะ');
  if (!time) throw new MemberAuthError('บอกเวลานัดด้วยนะ');
  const maxMembers = Math.min(15, Math.max(2, Math.round(Number(input.maxMembers)) || 4));
  await guardMemberText(member, `${title} ${meetupPoint} ${note}`, 'กลุ่มในงานแฟร์');
  if (store.read().filter((g) => g.fairId === fairId && g.creatorId === member.id).length >= MAX_GROUPS_PER_MEMBER_PER_FAIR) {
    throw new MemberAuthError(`เปิดได้ ${MAX_GROUPS_PER_MEMBER_PER_FAIR} กลุ่มต่องาน ลบกลุ่มเก่าก่อนนะ`, 429);
  }
  const group: FairGroup = { id: `grp_${randomUUID()}`, fairId, title, meetupPoint, time, note, maxMembers, creatorId: member.id, memberIds: [member.id], createdAt: new Date().toISOString() };
  await store.update((items) => [group, ...items]);
  return group;
}

export async function joinFairGroup(member: Member, groupId: string): Promise<FairGroup> {
  const found = fairGroupById(groupId);
  if (!found) throw new MemberAuthError('ไม่พบกลุ่มนี้', 404);
  await requireOpenFair(found.fairId);
  await guardMemberText(member, '', 'กลุ่มในงานแฟร์');
  let result: FairGroup | null = null;
  let full = false;
  // The seat check and the write happen under the store's lock
  await store.update((items) =>
    items.map((g) => {
      if (g.id !== groupId) return g;
      if (g.memberIds.includes(member.id)) return (result = g);
      if (g.memberIds.length >= g.maxMembers) {
        full = true;
        return g;
      }
      return (result = { ...g, memberIds: [...g.memberIds, member.id] });
    })
  );
  if (full || !result) throw new MemberAuthError(full ? 'กลุ่มนี้เต็มแล้ว' : 'ไม่พบกลุ่มนี้', full ? 409 : 404);
  return result;
}

/** Leaving one's own group closes it for everyone */
export async function leaveFairGroup(member: Member, groupId: string): Promise<{ closed: boolean }> {
  const found = fairGroupById(groupId);
  if (!found || !found.memberIds.includes(member.id)) throw new MemberAuthError('คุณไม่ได้อยู่ในกลุ่มนี้', 404);
  const closed = found.creatorId === member.id;
  await store.update((items) => (closed ? items.filter((g) => g.id !== groupId) : items.map((g) => (g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== member.id) } : g))));
  return { closed };
}

export async function myFairGroups(memberId: string) {
  const result = [];
  for (const group of store.read().filter((g) => g.memberIds.includes(memberId))) {
    const fair = await db.findEventById(group.fairId);
    result.push({ id: group.id, fairId: group.fairId, fairTitle: fair?.title ?? '', title: group.title, time: group.time, meetupPoint: group.meetupPoint, isMine: group.creatorId === memberId });
  }
  return result;
}

/** Account deletion: groups the member opened are closed; they leave the others */
export async function removeFairGroupsOf(memberId: string): Promise<void> {
  await store.update((items) => items.filter((g) => g.creatorId !== memberId).map((g) => (g.memberIds.includes(memberId) ? { ...g, memberIds: g.memberIds.filter((id) => id !== memberId) } : g)));
}
