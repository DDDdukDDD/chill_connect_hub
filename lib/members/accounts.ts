import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { burnPasswordCheck, hashPassword, verifyPasswordHash } from '../passwordHash';
import { NEW_MEMBER_NAME, nameKey, reservedNameProblem, tidyDisplayName } from '../displayName';
import { memberRepository } from './index';
import { MIN_MEMBER_AGE, cleanPreferences, newConsent } from './preferences';
import { refreshMemberStatus } from './session';
import { isDisposableEmail } from './trust';
import type { LoginMethod, Member, OAuthProvider } from './types';

export const MIN_MEMBER_PASSWORD = 8;

export class MemberAuthError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * An email a member typed into an account that signs in only with LINE, Google, Facebook or Apple (addEmail) and has
 * not confirmed yet. It proves nothing, so it never decides who owns that address: whoever proves it takes it over.
 */
const isUnprovenClaim = (member: Member) => Boolean(member.email) && !member.emailVerified && !member.hasPassword && member.providers.length > 0;

/** Takes an unproven email (and its pending link) off an account, so the person who proves the address can have it */
async function releaseEmail(member: Member): Promise<void> {
  await memberRepository.update(member.id, { email: undefined, emailVerified: false, emailVerification: undefined });
}

/**
 * Adds an email to an account that has none (LINE gives none), or changes one that is not confirmed yet, so the
 * member can confirm it and open ตี้ while the live site has no SMS (owner 2026-11-24). Only for accounts without a
 * password: an email sign-up logs in with its email and keeps it. The caller sends the link (sendVerification).
 */
export async function addEmail(member: Member, emailInput: unknown): Promise<Member> {
  if (member.ownerId) throw new MemberAuthError('บัญชีย่อยใช้อีเมลของบัญชีหลัก');
  if (member.emailVerified) throw new MemberAuthError('บัญชีนี้ยืนยันอีเมลแล้ว');
  if (member.hasPassword) throw new MemberAuthError('บัญชีนี้ใช้อีเมลที่สมัครไว้ กดส่งลิงก์ยืนยันได้เลย');
  const email = typeof emailInput === 'string' ? normalizeEmail(emailInput) : '';
  if (!isEmail(email) || email.length > 254) throw new MemberAuthError('อีเมลไม่ถูกต้อง');
  if (isDisposableEmail(email)) throw new MemberAuthError('ใช้อีเมลแบบใช้แล้วทิ้งไม่ได้ ใส่อีเมลที่คุณใช้จริงนะ');
  if (member.email === email) return member;
  const owner = await memberRepository.findByEmail(email);
  if (owner && owner.id !== member.id) throw new MemberAuthError('อีเมลนี้ใช้กับบัญชีอื่นแล้ว', 409);
  try {
    // A new address drops the old pending link, so a link sent to the old one stops working
    return await memberRepository.update(member.id, { email, emailVerified: false, emailVerification: undefined });
  } catch (error) {
    // Two accounts adding the same address at the same moment: the unique index lets one through
    if ((error as { code?: string }).code === '23505') throw new MemberAuthError('อีเมลนี้ใช้กับบัญชีอื่นแล้ว', 409);
    throw error;
  }
}

export function cleanDisplayName(name: unknown): string {
  const value = typeof name === 'string' ? tidyDisplayName(name).trim().slice(0, 40) : '';
  if (value.length < 2) throw new MemberAuthError('กรุณาตั้งชื่อที่แสดงอย่างน้อย 2 ตัวอักษร');
  const reserved = reservedNameProblem(value);
  if (reserved) throw new MemberAuthError(reserved);
  return value;
}

export const NAME_TAKEN_MESSAGE = 'ชื่อนี้มีคนใช้แล้ว ลองเพิ่มนามสกุล ชื่อเล่น หรือตัวเลขนะ';

/**
 * No two members share a name (BE-394, owner 2026-11-16), compared by nameKey. The placeholder "สมาชิกใหม่" is exempt:
 * everyone who has not finished onboarding carries it. `exceptId`: the member whose own name this may already be.
 */
export async function isNameFree(name: string, exceptId?: string): Promise<boolean> {
  if (tidyDisplayName(name).trim() === NEW_MEMBER_NAME) return true;
  return !(await memberRepository.isNameTaken(nameKey(name), exceptId));
}

export async function ensureNameFree(name: string, exceptId?: string): Promise<void> {
  if (!(await isNameFree(name, exceptId))) throw new MemberAuthError(NAME_TAKEN_MESSAGE, 409);
}

function statusError(member: Member): MemberAuthError | null {
  if (member.status === 'banned') return new MemberAuthError('บัญชีนี้ถูกระงับการใช้งานถาวร', 403);
  if (member.status === 'suspended') {
    const until = member.suspendedUntil ? new Date(member.suspendedUntil).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '';
    return new MemberAuthError(`บัญชีนี้ถูกระงับชั่วคราว${until ? `ถึง ${until}` : ''}`, 403);
  }
  return null;
}

async function markLogin(member: Member, method: LoginMethod): Promise<Member> {
  return memberRepository.update(member.id, { lastLoginAt: new Date().toISOString(), lastLoginMethod: method });
}

/** A new account that came from someone's shared post link: credited to the sharer and the author (docs/TRACEABILITY.md) */
async function noteSignupSource(member: Member): Promise<void> {
  // Loaded here so the members module and the action log do not import each other at start-up
  await import('../social/actionLog').then((log) => log.traceSignup(member)).catch(() => undefined);
}

export async function registerWithEmail(input: { displayName?: unknown; email: unknown; password: unknown; consent: unknown; ageConfirmed?: unknown }): Promise<Member> {
  if (input.consent !== true) throw new MemberAuthError('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
  if (input.ageConfirmed !== true) throw new MemberAuthError(`กรุณายืนยันว่าคุณอายุ ${MIN_MEMBER_AGE} ปีขึ้นไป`);
  // The sign-up form no longer asks for a name: onboarding does. Never fall back to the email, which would show it to others
  const displayName = input.displayName === undefined || input.displayName === '' ? NEW_MEMBER_NAME : cleanDisplayName(input.displayName);
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  if (!isEmail(email)) throw new MemberAuthError('อีเมลไม่ถูกต้อง');
  if (typeof input.password !== 'string' || input.password.length < MIN_MEMBER_PASSWORD) {
    throw new MemberAuthError(`รหัสผ่านต้องมีอย่างน้อย ${MIN_MEMBER_PASSWORD} ตัวอักษร`);
  }
  const existing = await memberRepository.findByEmail(email);
  if (existing && !isUnprovenClaim(existing)) throw new MemberAuthError('อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน', 409);
  await ensureNameFree(displayName);
  if (existing) await releaseEmail(existing);
  const now = new Date().toISOString();
  const member = await memberRepository.create({
    id: `mem_${randomUUID()}`,
    displayName,
    email,
    emailVerified: false, // no email service yet
    passwordHash: hashPassword(input.password),
    providers: [],
    status: 'active',
    sessionVersion: 1,
    consentAt: now,
    consent: newConsent('signup_form', true),
    createdAt: now,
    lastLoginAt: now,
    lastLoginMethod: 'email',
  });
  await noteSignupSource(member);
  return member;
}

export async function loginWithEmail(emailInput: unknown, password: unknown): Promise<Member> {
  const email = typeof emailInput === 'string' ? normalizeEmail(emailInput) : '';
  const secret = typeof password === 'string' ? password : '';
  const found = email ? await memberRepository.findByEmail(email) : null;
  const hash = found ? await memberRepository.passwordHashOf(found.id) : null;
  if (!found || !hash) {
    burnPasswordCheck(secret);
    throw new MemberAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  if (!verifyPasswordHash(secret, hash)) throw new MemberAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  const member = await refreshMemberStatus(found);
  const blocked = statusError(member);
  if (blocked) throw blocked;
  return markLogin(member, 'email');
}

export interface OAuthProfile {
  provider: OAuthProvider;
  subject: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  /** Apple only: kept to revoke on account deletion (lib/members/appleTokens.ts); never stored on the member */
  refreshToken?: string;
}

/**
 * Signs in with a provider identity: an already linked account, else an account with the same verified
 * email (the provider is linked to it), else a new account. Social sign-up counts as consent because the
 * login screen states the terms next to the buttons.
 */
export async function signInWithOAuth(profile: OAuthProfile, options: { consented?: boolean } = {}): Promise<{ member: Member; created: boolean }> {
  const email = profile.email ? normalizeEmail(profile.email) : undefined;
  let member = await memberRepository.findByProvider(profile.provider, profile.subject);
  let created = false;

  if (!member && email && profile.emailVerified) {
    const byEmail = await memberRepository.findByEmail(email);
    // Never sign someone into an account because it typed their address in: the unproven claim is dropped instead
    if (byEmail && isUnprovenClaim(byEmail)) await releaseEmail(byEmail);
    else if (byEmail) {
      member = await memberRepository.update(byEmail.id, {
        providers: [...byEmail.providers, { provider: profile.provider, subject: profile.subject, linkedAt: new Date().toISOString() }],
        emailVerified: true,
        avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
      });
    }
  }

  if (!member) {
    const now = new Date().toISOString();
    const emailTaken = email ? Boolean(await memberRepository.findByEmail(email)) : false;
    // A provider name that reads as staff is not carried over; onboarding asks for a name anyway
    const providerName = profile.displayName ? tidyDisplayName(profile.displayName).trim().slice(0, 40) : '';
    // A name someone already uses is not carried over either (BE-394): onboarding asks for one, so sign-in never fails on it
    const candidate = (reservedNameProblem(providerName) ? '' : providerName) || (email ? email.split('@')[0] : NEW_MEMBER_NAME);
    member = await memberRepository.create({
      id: `mem_${randomUUID()}`,
      displayName: (await isNameFree(candidate)) ? candidate : NEW_MEMBER_NAME,
      // An unverified email that already belongs to someone else is not attached
      email: email && !emailTaken ? email : undefined,
      emailVerified: Boolean(email && !emailTaken && profile.emailVerified),
      avatarUrl: profile.avatarUrl,
      providers: [{ provider: profile.provider, subject: profile.subject, linkedAt: now }],
      status: 'active',
      sessionVersion: 1,
      consentAt: now,
      // From the sign-up screen both boxes were ticked; from the log-in screen only the notice was shown
      consent: newConsent(options.consented ? 'signup_form' : 'social_login', Boolean(options.consented)),
      createdAt: now,
    });
    created = true;
    await noteSignupSource(member);
  }

  member = await refreshMemberStatus(member);
  const blocked = statusError(member);
  if (blocked) throw blocked;
  return { member: await markLogin(member, profile.provider), created };
}

export async function updateProfile(member: Member, input: { displayName?: unknown; avatarUrl?: unknown }): Promise<Member> {
  const changes: Partial<Member> = {};
  if (input.displayName !== undefined) {
    changes.displayName = cleanDisplayName(input.displayName);
    // Only a real change is checked, so an older account that already shares a name can still save its photo
    if (nameKey(changes.displayName) !== nameKey(member.displayName)) await ensureNameFree(changes.displayName, member.id);
  }
  if (input.avatarUrl !== undefined) {
    const url = typeof input.avatarUrl === 'string' ? input.avatarUrl.trim() : '';
    // Inline photos come only from a local server's uploads (lib/media/adapters/localStorageAdapter.ts); live members' go to Blob
    const isLocalInline = !process.env.VERCEL && url.length <= 300_000 && /^data:image\/(webp|jpeg|png|avif);base64,/.test(url);
    if (url && !/^https:\/\//.test(url) && !url.startsWith('/') && !isLocalInline) throw new MemberAuthError('URL รูปโปรไฟล์ไม่ถูกต้อง');
    changes.avatarUrl = url || undefined;
  }
  return memberRepository.update(member.id, changes);
}

export async function changePassword(member: Member, current: unknown, next: unknown): Promise<Member> {
  const hash = member.hasPassword ? await memberRepository.passwordHashOf(member.id) : null;
  if (hash && !verifyPasswordHash(typeof current === 'string' ? current : '', hash)) {
    throw new MemberAuthError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401);
  }
  if (typeof next !== 'string' || next.length < MIN_MEMBER_PASSWORD) throw new MemberAuthError(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_MEMBER_PASSWORD} ตัวอักษร`);
  if (!member.email) throw new MemberAuthError('บัญชีนี้ยังไม่มีอีเมล จึงตั้งรหัสผ่านไม่ได้');
  // A first password turns the email into a login: it must be the member's own (an added email, addEmail)
  if (!hash && !member.emailVerified) throw new MemberAuthError('ยืนยันอีเมลก่อนนะ แล้วจึงตั้งรหัสผ่านได้');
  return memberRepository.update(member.id, { passwordHash: hashPassword(next), sessionVersion: member.sessionVersion + 1 });
}

export const PASSWORD_RESET_MINUTES = 30;
const hashToken = (secret: string) => createHash('sha256').update(secret).digest('hex');

/**
 * Starts "forgot password". Returns the one-time token to deliver by email, or null when no account
 * (or a blocked one) uses this email — callers must answer the same way in both cases.
 * Token format: "<memberId>.<secret>"; only a hash of the secret is stored.
 */
export async function createPasswordReset(emailInput: unknown): Promise<{ member: Member; token: string } | null> {
  const email = typeof emailInput === 'string' ? normalizeEmail(emailInput) : '';
  if (!isEmail(email)) throw new MemberAuthError('อีเมลไม่ถูกต้อง');
  const found = await memberRepository.findByEmail(email);
  if (!found || found.status === 'banned') return null;
  const secret = randomBytes(32).toString('base64url');
  const member = await memberRepository.update(found.id, {
    passwordReset: { tokenHash: hashToken(secret), expiresAt: new Date(Date.now() + PASSWORD_RESET_MINUTES * 60_000).toISOString() },
  });
  return { member, token: `${found.id}.${secret}` };
}

/** Sets a new password from a reset link; ends every other session and proves the email belongs to them */
export async function resetPasswordWithToken(tokenInput: unknown, password: unknown): Promise<Member> {
  const invalid = new MemberAuthError('ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่', 400);
  const token = typeof tokenInput === 'string' ? tokenInput : '';
  const dot = token.lastIndexOf('.');
  if (dot <= 0) throw invalid;
  const member = await memberRepository.findById(token.slice(0, dot));
  const pending = member?.passwordReset;
  if (!member || !pending || new Date(pending.expiresAt).getTime() < Date.now()) throw invalid;
  const given = Buffer.from(hashToken(token.slice(dot + 1)));
  const stored = Buffer.from(pending.tokenHash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) throw invalid;
  if (typeof password !== 'string' || password.length < MIN_MEMBER_PASSWORD) {
    throw new MemberAuthError(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_MEMBER_PASSWORD} ตัวอักษร`);
  }
  const blocked = statusError(await refreshMemberStatus(member));
  if (blocked) throw blocked;
  const updated = await memberRepository.update(member.id, {
    passwordHash: hashPassword(password),
    passwordReset: undefined,
    emailVerified: true,
    sessionVersion: member.sessionVersion + 1,
  });
  return markLogin(updated, 'email');
}

/** Saves onboarding answers; the first save marks the member as onboarded */
export async function savePreferences(member: Member, input: unknown): Promise<Member> {
  const preferences = cleanPreferences(input);
  return memberRepository.update(member.id, { preferences, onboardedAt: member.onboardedAt ?? preferences.updatedAt });
}

/**
 * Everything stored about a member, for an admin handling a PDPA request, or (forMember) for the member's own
 * download, which leaves out staff-only safety notes: risk flags, who reported them, and the sign-up fingerprint.
 */
export function exportableAccount(member: Member, options: { forMember?: boolean } = {}) {
  const { passwordHash: _hash, hasPassword, sessionVersion: _version, passwordReset: _reset, emailVerification: _verify, phoneVerification: _phoneCode, ...account } = member;
  void _hash;
  void _version;
  void _reset;
  void _verify;
  void _phoneCode;
  if (options.forMember) {
    const { riskFlags: _flags, riskReviewedAt: _reviewed, signupIpHash: _ip, reportsReceived: _reports, ...own } = account;
    void _flags;
    void _reviewed;
    void _ip;
    void _reports;
    return { ...own, hasPassword: Boolean(hasPassword) };
  }
  return { ...account, hasPassword: Boolean(hasPassword) };
}
