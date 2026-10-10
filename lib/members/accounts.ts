import { randomUUID } from 'node:crypto';
import { burnPasswordCheck, hashPassword, verifyPasswordHash } from '../passwordHash';
import { memberRepository } from './index';
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
  const value = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 40) : '';
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

export async function registerWithEmail(input: { displayName: unknown; email: unknown; password: unknown; consent: unknown }): Promise<Member> {
  if (input.consent !== true) throw new MemberAuthError('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
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
export async function signInWithOAuth(profile: OAuthProfile): Promise<Member> {
  const email = profile.email ? normalizeEmail(profile.email) : undefined;
  let member = await memberRepository.findByProvider(profile.provider, profile.subject);

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
      displayName: profile.displayName?.trim().slice(0, 40) || (email ? email.split('@')[0] : 'สมาชิกใหม่'),
      // An unverified email that already belongs to someone else is not attached
      email: email && !emailTaken ? email : undefined,
      emailVerified: Boolean(email && !emailTaken && profile.emailVerified),
      avatarUrl: profile.avatarUrl,
      providers: [{ provider: profile.provider, subject: profile.subject, linkedAt: now }],
      status: 'active',
      sessionVersion: 1,
      consentAt: now,
      createdAt: now,
    });
  }

  member = await refreshMemberStatus(member);
  const blocked = statusError(member);
  if (blocked) throw blocked;
  return markLogin(member, profile.provider);
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
