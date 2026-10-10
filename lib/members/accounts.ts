import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { burnPasswordCheck, hashPassword, verifyPasswordHash } from '../passwordHash';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from './index';
import { MIN_MEMBER_AGE, cleanPreferences, newConsent } from './preferences';
import { refreshMemberStatus } from './session';
import type { LoginMethod, Member, OAuthProvider } from './types';

export const MIN_MEMBER_PASSWORD = 8;

export class MemberAuthError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function cleanDisplayName(name: unknown): string {
  const value = typeof name === 'string' ? tidyDisplayName(name).trim().slice(0, 40) : '';
  if (value.length < 2) throw new MemberAuthError('กรุณาตั้งชื่อที่แสดงอย่างน้อย 2 ตัวอักษร');
  return value;
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

export async function registerWithEmail(input: { displayName: unknown; email: unknown; password: unknown; consent: unknown; ageConfirmed?: unknown }): Promise<Member> {
  if (input.consent !== true) throw new MemberAuthError('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
  if (input.ageConfirmed !== true) throw new MemberAuthError(`กรุณายืนยันว่าคุณอายุ ${MIN_MEMBER_AGE} ปีขึ้นไป`);
  const displayName = cleanDisplayName(input.displayName);
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  if (!isEmail(email)) throw new MemberAuthError('อีเมลไม่ถูกต้อง');
  if (typeof input.password !== 'string' || input.password.length < MIN_MEMBER_PASSWORD) {
    throw new MemberAuthError(`รหัสผ่านต้องมีอย่างน้อย ${MIN_MEMBER_PASSWORD} ตัวอักษร`);
  }
  if (await memberRepository.findByEmail(email)) throw new MemberAuthError('อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน', 409);
  const now = new Date().toISOString();
  return memberRepository.create({
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
}

export async function loginWithEmail(emailInput: unknown, password: unknown): Promise<Member> {
  const email = typeof emailInput === 'string' ? normalizeEmail(emailInput) : '';
  const secret = typeof password === 'string' ? password : '';
  const found = email ? await memberRepository.findByEmail(email) : null;
  if (!found || !found.passwordHash) {
    burnPasswordCheck(secret);
    throw new MemberAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  if (!verifyPasswordHash(secret, found.passwordHash)) throw new MemberAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
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
    if (byEmail) {
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
    member = await memberRepository.create({
      id: `mem_${randomUUID()}`,
      displayName: (profile.displayName ? tidyDisplayName(profile.displayName).trim().slice(0, 40) : '') || (email ? email.split('@')[0] : 'สมาชิกใหม่'),
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
  }

  member = await refreshMemberStatus(member);
  const blocked = statusError(member);
  if (blocked) throw blocked;
  return { member: await markLogin(member, profile.provider), created };
}

export async function updateProfile(member: Member, input: { displayName?: unknown; avatarUrl?: unknown }): Promise<Member> {
  const changes: Partial<Member> = {};
  if (input.displayName !== undefined) changes.displayName = cleanDisplayName(input.displayName);
  if (input.avatarUrl !== undefined) {
    const url = typeof input.avatarUrl === 'string' ? input.avatarUrl.trim() : '';
    if (url && !/^https:\/\//.test(url) && !url.startsWith('/')) throw new MemberAuthError('URL รูปโปรไฟล์ไม่ถูกต้อง');
    changes.avatarUrl = url || undefined;
  }
  return memberRepository.update(member.id, changes);
}

export async function changePassword(member: Member, current: unknown, next: unknown): Promise<Member> {
  if (member.passwordHash && !verifyPasswordHash(typeof current === 'string' ? current : '', member.passwordHash)) {
    throw new MemberAuthError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401);
  }
  if (typeof next !== 'string' || next.length < MIN_MEMBER_PASSWORD) throw new MemberAuthError(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_MEMBER_PASSWORD} ตัวอักษร`);
  if (!member.email) throw new MemberAuthError('บัญชีนี้ยังไม่มีอีเมล จึงตั้งรหัสผ่านไม่ได้');
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
  const { passwordHash, sessionVersion: _version, passwordReset: _reset, emailVerification: _verify, ...account } = member;
  void _version;
  void _reset;
  void _verify;
  if (options.forMember) {
    const { riskFlags: _flags, riskReviewedAt: _reviewed, signupIpHash: _ip, reportsReceived: _reports, ...own } = account;
    void _flags;
    void _reviewed;
    void _ip;
    void _reports;
    return { ...own, hasPassword: Boolean(passwordHash) };
  }
  return { ...account, hasPassword: Boolean(passwordHash) };
}
