import { randomUUID } from 'node:crypto';
import { MemberAuthError, cleanDisplayName, ensureNameFree } from './accounts';
import { memberRepository } from './index';
import { newConsent } from './preferences';
import { refreshMemberStatus } from './session';
import { applySignupChecks } from './safety';
import { PLEDGE_VERSION, trustLevel } from './trust';
import { toPublicMember, type AccountChoice, type Member } from './types';

/**
 * Extra accounts and switching between them, like Instagram (BE-393, owner 2026-11-16).
 *
 * - A member (the owner) holds up to accountLimitOf(owner) accounts in all: DEFAULT_ACCOUNT_LIMIT, or what staff set
 *   in the admin console. Lowering the limit never deletes accounts; it only stops new ones. A sub-account has no email, password or social
 *   sign-in: it is reached only by switching from its owner or a sibling, and it is deleted with the owner.
 * - Only an owner who is at least "verified" (identity and pledge) can make one; the sub-account stands on that
 *   identity (lib/members/trust.ts), and its phone and email checks too (BE-394): once the owner verified their
 *   phone, a sub-account can open ตี้. Host approval stays per account.
 * - The accounts of one owner are one "family". A family counts as one person where that matters for safety: two of
 *   its accounts never sit in the same ตี้, trip, waiting list or อีเวนต์ group (owner 2026-11-16). Rewards, XP and
 *   draw entries are counted per account, and staff see the family on draw winners (lib/campaigns/draw.ts).
 * - A sub-account session ends when the owner's sign-in does (lib/members/session.ts).
 */
/** Accounts per person, the main one included, unless staff set another number for that owner (owner 2026-11-16) */
export const DEFAULT_ACCOUNT_LIMIT = 3;
export const MAX_ACCOUNT_LIMIT = 10;
export const accountLimitOf = (owner: Pick<Member, 'accountLimit'>) => owner.accountLimit ?? DEFAULT_ACCOUNT_LIMIT;

/** The id every account of one family shares: the owner's */
export const familyIdOf = (member: Pick<Member, 'id' | 'ownerId'>) => member.ownerId ?? member.id;

/** The owner and every sub-account, owner first */
async function familyOf(member: Member): Promise<{ owner: Member; accounts: Member[] }> {
  const owner = member.ownerId ? await memberRepository.findFresh(member.ownerId) : member;
  if (!owner) throw new MemberAuthError('ไม่พบบัญชีหลัก', 404);
  return { owner, accounts: [owner, ...(await memberRepository.findSubAccounts(owner.id))] };
}

/** Every account id of the member's family, the member's own included */
export async function familyIdsOf(member: Member): Promise<Set<string>> {
  const owner = familyIdOf(member);
  return new Set([owner, ...(await memberRepository.findSubAccounts(owner)).map((m) => m.id)]);
}

export async function accountChoices(member: Member): Promise<{ accounts: AccountChoice[]; canCreate: boolean; max: number }> {
  const { owner, accounts } = await familyOf(member);
  const choices = await Promise.all(
    accounts.map(async (account) => {
      const current = await refreshMemberStatus(account);
      const shown = toPublicMember(current);
      return { id: current.id, displayName: shown.displayName, avatarUrl: shown.avatarUrl, isOwner: !current.ownerId, isCurrent: current.id === member.id, available: current.status === 'active' };
    }),
  );
  const limit = accountLimitOf(owner);
  return { accounts: choices, canCreate: accounts.length < limit && trustLevel(owner) !== 'new', max: limit };
}

/** Makes a sub-account under the member's owner (a sub-account can add a sibling). Returns it and its owner for the session */
export async function createSubAccount(member: Member, input: { displayName?: unknown; consent?: unknown }): Promise<{ account: Member; owner: Member }> {
  const { owner, accounts } = await familyOf(member);
  if (trustLevel(owner) === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ที่บัญชีหลักก่อนนะ แล้วจะสร้างบัญชีเพิ่มได้', 403);
  if (accounts.length >= accountLimitOf(owner)) throw new MemberAuthError(`มีได้สูงสุด ${accountLimitOf(owner)} บัญชีรวมบัญชีหลัก`, 409);
  if (input.consent !== true) throw new MemberAuthError('กรุณายอมรับข้อกำหนดการใช้งานสำหรับบัญชีนี้');
  const displayName = cleanDisplayName(input.displayName);
  await ensureNameFree(displayName);
  const now = new Date().toISOString();
  const created = await memberRepository.create({
    id: `mem_${randomUUID()}`,
    displayName,
    emailVerified: false,
    providers: [],
    status: 'active',
    sessionVersion: 1,
    ownerId: owner.id,
    consentAt: now,
    // The owner ticked the box for this account; their age was confirmed at their own sign-up
    consent: newConsent('signup_form', Boolean(owner.consent?.ageConfirmedAt)),
    // Same person, same promise: the owner accepted the pledge before they could make this account
    pledgeAcceptedAt: now,
    pledgeVersion: PLEDGE_VERSION,
    // Same person: birth year, gender and province start as the owner's, so onboarding comes prefilled (owner 2026-11-16).
    // Not onboarded yet (no onboardedAt), and interests stay empty: the new account picks its own
    ...(owner.preferences && {
      preferences: {
        intent: 'member' as const,
        goals: [],
        birthYear: owner.preferences.birthYear,
        gender: owner.preferences.gender,
        province: owner.preferences.province,
        interests: { communityCategories: [], spotVibes: [], fairCategories: [] },
        updatedAt: now,
      },
    }),
    createdAt: now,
    lastLoginAt: now,
  });
  return { account: await applySignupChecks(created), owner };
}

/** The account to switch to, checked: in the same family and allowed to use the site. Returns it and its owner */
export async function switchTarget(member: Member, targetId: unknown): Promise<{ account: Member; owner?: Member }> {
  if (typeof targetId !== 'string' || !targetId) throw new MemberAuthError('เลือกบัญชีที่จะสลับไป');
  const { owner, accounts } = await familyOf(member);
  const found = accounts.find((a) => a.id === targetId);
  if (!found) throw new MemberAuthError('สลับไปบัญชีนี้ไม่ได้', 403);
  if ((await refreshMemberStatus(owner)).status !== 'active') throw new MemberAuthError('บัญชีหลักถูกระงับอยู่', 403);
  const account = await refreshMemberStatus(found);
  if (account.status !== 'active') throw new MemberAuthError('บัญชีนี้ถูกระงับอยู่', 403);
  const switched = await memberRepository.update(account.id, { lastLoginAt: new Date().toISOString() });
  return { account: switched, owner: switched.ownerId ? owner : undefined };
}

/**
 * Whether another account of the member's family is already among these people (ตี้ participants, the host, a
 * waiting list, an อีเวนต์ group): one person never counts twice where people meet (owner 2026-11-16).
 */
export async function familyAlreadyIn(member: Member, peopleIds: Iterable<string>): Promise<boolean> {
  const family = await familyIdsOf(member);
  if (family.size === 1) return false;
  for (const id of peopleIds) if (id !== member.id && family.has(id)) return true;
  return false;
}

/** Staff: the owner and sub-accounts of a member's family, for the admin member page */
export async function familyForStaff(member: Member) {
  const { owner, accounts } = await familyOf(member);
  return {
    ownerId: owner.id,
    limit: accountLimitOf(owner),
    isDefaultLimit: owner.accountLimit === undefined,
    accounts: accounts.map((a) => ({ id: a.id, displayName: toPublicMember(a).displayName, isOwner: !a.ownerId, status: a.status })),
  };
}

/** Staff: sets how many accounts the member's owner may hold; null goes back to the default */
export async function setAccountLimit(member: Member, limit: unknown): Promise<Member> {
  const owner = member.ownerId ? await memberRepository.findFresh(member.ownerId) : member;
  if (!owner) throw new MemberAuthError('ไม่พบบัญชีหลัก', 404);
  if (limit === null) return memberRepository.update(owner.id, { accountLimit: undefined });
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1 || value > MAX_ACCOUNT_LIMIT) throw new MemberAuthError(`ระบุจำนวนบัญชี 1-${MAX_ACCOUNT_LIMIT}`);
  return memberRepository.update(owner.id, { accountLimit: value });
}

// Read as a refusal by components/Toast.tsx ("ไม่ได้"), so it never shows a success tick
export const FAMILY_ALREADY_IN_MESSAGE = 'เข้าซ้ำไม่ได้ บัญชีอื่นของคุณอยู่ในกลุ่มนี้ ใช้บัญชีเดียวต่อหนึ่งกลุ่มนะ';
