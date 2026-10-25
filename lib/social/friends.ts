import { randomBytes } from 'node:crypto';
import { db } from '../db';
import { memberRepository } from '../members';
import type { Member } from '../members/types';

/**
 * Friends for the friend campaigns (owner 2026-10-25): "ตั๋วเพื่อนซี้" (an invite link) and "ยกแก๊งไปตี้".
 * Two members are friends through an invite (one signed up with the other's link) or by following each other.
 * Rewards never come from signing up: only from being checked in at the same ตี้, which a fake account cannot fake.
 */

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Cookie that keeps a ?ref= code from an invite link until the visitor signs up (components/InviteRefCapture.tsx) */
export const INVITE_COOKIE = 'cch_ref';

/**
 * Links a new account to the member whose invite code it came with. Set once; a member cannot invite themselves.
 * Sign-up never fails because of a bad code.
 */
export async function attachInviter(member: Member, code: string | null | undefined): Promise<void> {
  if (!code || member.invitedBy) return;
  const inviter = await memberByInviteCode(code);
  if (!inviter || inviter.id === member.id || inviter.status !== 'active') return;
  await memberRepository.update(member.id, { invitedBy: inviter.id });
}

/** The member's invite code, made and saved on first ask */
export async function inviteCodeOf(member: Member): Promise<string> {
  if (member.inviteCode) return member.inviteCode;
  let code = '';
  do {
    code = Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  } while (await memberByInviteCode(code));
  await memberRepository.update(member.id, { inviteCode: code });
  return code;
}

export async function memberByInviteCode(code: string): Promise<Member | null> {
  const wanted = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(wanted)) return null;
  const { items } = await memberRepository.query({ status: 'all', page: 1, limit: 100_000 });
  return items.find((m) => m.inviteCode === wanted) ?? null;
}

/** Members who signed up with this member's link, newest first */
export async function inviteesOf(memberId: string): Promise<Member[]> {
  const { items } = await memberRepository.query({ status: 'all', page: 1, limit: 100_000 });
  return items.filter((m) => m.invitedBy === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Who counts as a friend: 'invite' = the member who invited them and those they invited;
 * 'any' adds members they follow who follow them back
 */
export async function friendIdsOf(member: Member, via: 'invite' | 'any'): Promise<Set<string>> {
  const friends = new Set<string>();
  if (member.invitedBy) friends.add(member.invitedBy);
  for (const invitee of await inviteesOf(member.id)) friends.add(invitee.id);
  if (via === 'any') {
    for (const id of member.followingIds ?? []) {
      const other = await memberRepository.findById(id);
      if (other?.followingIds?.includes(member.id)) friends.add(id);
    }
  }
  return friends;
}

/** ตี้ the member was checked in at, with the other members checked in there too */
export async function checkedInTogether(memberId: string): Promise<{ eventId: string; at: string; others: string[] }[]> {
  const result: { eventId: string; at: string; others: string[] }[] = [];
  for (const { eventId } of await db.listParticipations(memberId)) {
    const people = await db.listParticipants(eventId);
    const mine = people.find((p) => p.userId === memberId);
    if (!mine?.checkedInAt) continue;
    result.push({ eventId, at: mine.checkedInAt, others: people.filter((p) => p.userId !== memberId && p.checkedInAt).map((p) => p.userId) });
  }
  return result;
}

/** Whether two members were both checked in at one ตี้ */
export async function wentTogether(a: string, b: string): Promise<boolean> {
  return (await checkedInTogether(a)).some((entry) => entry.others.includes(b));
}
