import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { momentRepository } from '../moments';
import { MemberAuthError } from './accounts';
import { memberRepository } from './index';
import {
  NEW_ACCOUNT_DAYS, NEW_ACCOUNT_LIMITS, PLEDGE_VERSION, accountAgeDays, containsContactInfo, isDisposableEmail, makeFlag, riskTermsIn, trustLevel, trustOf,
} from './trust';
import {
  PROFILE_FIELD_KEYS, PROFILE_HIDDEN_BY_DEFAULT, PROFILE_TEXT_FIELDS,
  type HostApplication, type Member, type MemberProfile, type ProfileFieldKey, type RiskFlag,
} from './types';

/**
 * Server-side trust and safety actions for members: sign-up checks, the community pledge, email
 * verification, profile details, host applications, reports and blocks, and the rules that hold back
 * new accounts. The rules themselves (levels, limits, word lists) live in trust.ts.
 */
export const EMAIL_VERIFY_HOURS = 48;
const DAY = 24 * 60 * 60 * 1000;
const hashToken = (secret: string) => createHash('sha256').update(secret).digest('hex');

/** One-way fingerprint of an IP address: lets staff see "several accounts from one place" without storing the address */
export function hashIp(ip: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 16);
}

export async function addRiskFlags(memberId: string, flags: RiskFlag[]): Promise<void> {
  if (!flags.length) return;
  const member = await memberRepository.findById(memberId);
  if (!member) return;
  // One flag per code and detail per day is enough for staff
  const seen = new Set((member.riskFlags ?? []).map((f) => `${f.code}|${f.detail}|${f.at.slice(0, 10)}`));
  const fresh = flags.filter((f) => !seen.has(`${f.code}|${f.detail}|${f.at.slice(0, 10)}`));
  if (fresh.length) await memberRepository.update(memberId, { riskFlags: [...(member.riskFlags ?? []), ...fresh].slice(-50) });
}

/** Run once right after an account is created */
export async function applySignupChecks(member: Member, ipHash: string | null): Promise<Member> {
  const flags: RiskFlag[] = [];
  if (isDisposableEmail(member.email)) flags.push(makeFlag('disposable_email', member.email?.split('@')[1] ?? ''));
  const nameTerms = riskTermsIn(member.displayName);
  if (nameTerms.length || containsContactInfo(member.displayName)) flags.push(makeFlag('risky_name', nameTerms.join(', ') || 'มีช่องทางติดต่อในชื่อ'));
  if (ipHash) {
    const { items } = await memberRepository.query({ status: 'all', page: 1, limit: 100_000 });
    const sameDay = items.filter((m) => m.id !== member.id && m.signupIpHash === ipHash && Date.now() - new Date(m.createdAt).getTime() < DAY);
    if (sameDay.length >= 2) flags.push(makeFlag('shared_ip', `${sameDay.length + 1} บัญชีใน 24 ชั่วโมง`));
  }
  return memberRepository.update(member.id, { signupIpHash: ipHash ?? undefined, riskFlags: flags.length ? flags : undefined });
}

/* ---------- Pledge ---------- */

export async function acceptPledge(member: Member): Promise<Member> {
  if (member.pledgeAcceptedAt && member.pledgeVersion === PLEDGE_VERSION) return member;
  return memberRepository.update(member.id, { pledgeAcceptedAt: new Date().toISOString(), pledgeVersion: PLEDGE_VERSION });
}

/* ---------- Email verification ---------- */

/** Returns the one-time token to email, or null when there is nothing to verify */
export async function createEmailVerification(member: Member): Promise<string | null> {
  if (!member.email || member.emailVerified) return null;
  const secret = randomBytes(32).toString('base64url');
  await memberRepository.update(member.id, { emailVerification: { tokenHash: hashToken(secret), expiresAt: new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000).toISOString() } });
  return `${member.id}.${secret}`;
}

export async function verifyEmailWithToken(tokenInput: unknown): Promise<Member> {
  const invalid = new MemberAuthError('ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่', 400);
  const token = typeof tokenInput === 'string' ? tokenInput : '';
  const dot = token.lastIndexOf('.');
  if (dot <= 0) throw invalid;
  const member = await memberRepository.findById(token.slice(0, dot));
  if (member?.emailVerified) return member; // opening the link twice is fine
  const pending = member?.emailVerification;
  if (!member || !pending || new Date(pending.expiresAt).getTime() < Date.now()) throw invalid;
  const given = Buffer.from(hashToken(token.slice(dot + 1)));
  const stored = Buffer.from(pending.tokenHash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) throw invalid;
  return memberRepository.update(member.id, { emailVerified: true, emailVerification: undefined });
}

/* ---------- Posting rules ---------- */

/**
 * Called before a member posts a moment or a comment.
 * - Must be at least "verified" (email confirmed and pledge accepted).
 * - Until trusted: a daily limit, and no contact details (links, phone numbers, LINE ids).
 * - Sales, investment and loan words are allowed through but flag the account for staff.
 */
export async function guardPosting(member: Member, kind: 'moment' | 'comment', text: string): Promise<void> {
  const level = trustLevel(member);
  if (level === 'new') {
    if (!member.emailVerified) throw new MemberAuthError('ยืนยันอีเมลก่อนนะ แล้วจะโพสต์และคอมเมนต์ได้ (ดูที่หน้าโปรไฟล์)', 403);
    throw new MemberAuthError('รับคำมั่นของคอมมูนิตี้ก่อนนะ แล้วจะโพสต์และคอมเมนต์ได้ (ดูที่หน้าโปรไฟล์)', 403);
  }
  if (level !== 'trusted') {
    if (containsContactInfo(text)) {
      await addRiskFlags(member.id, [makeFlag('contact_info', text.slice(0, 80))]);
      throw new MemberAuthError(`บัญชีใหม่ยังใส่ลิงก์ เบอร์โทร หรือไอดีไลน์ไม่ได้ในช่วง ${NEW_ACCOUNT_DAYS} วันแรก`, 400);
    }
    const since = Date.now() - DAY;
    const { items } = await momentRepository.query({ statuses: ['published', 'hidden'], sort: 'newest', page: 1, limit: 10_000 });
    const used = kind === 'moment'
      ? items.filter((m) => m.authorId === member.id && new Date(m.createdAt).getTime() > since).length
      : items.reduce((n, m) => n + m.comments.filter((c) => c.authorId === member.id && new Date(c.createdAt).getTime() > since).length, 0);
    const limit = kind === 'moment' ? NEW_ACCOUNT_LIMITS.momentsPerDay : NEW_ACCOUNT_LIMITS.commentsPerDay;
    if (used >= limit) {
      throw new MemberAuthError(kind === 'moment' ? `บัญชีใหม่โพสต์ได้วันละ ${limit} โมเมนต์ พรุ่งนี้โพสต์ต่อได้เลย` : `บัญชีใหม่คอมเมนต์ได้วันละ ${limit} ครั้ง`, 429);
    }
  }
  const terms = riskTermsIn(text);
  if (terms.length) await addRiskFlags(member.id, [makeFlag('risky_text', `${kind === 'moment' ? 'โมเมนต์' : 'คอมเมนต์'}: ${terms.join(', ')}`)]);
}

/* ---------- Profile details ---------- */

const PROFILE_MAX: Record<(typeof PROFILE_TEXT_FIELDS)[number], number> = {
  bio: 240, occupation: 60, workplace: 80, education: 80, hometown: 40, livingArea: 60, relationshipStatus: 30, connectGoal: 120,
};

export async function updateProfileDetails(member: Member, input: unknown): Promise<Member> {
  if (!input || typeof input !== 'object') throw new MemberAuthError('ข้อมูลไม่ถูกต้อง');
  const raw = input as Record<string, unknown>;
  const current: MemberProfile = member.profile ?? { hidden: [...PROFILE_HIDDEN_BY_DEFAULT] };
  const next: MemberProfile = { ...current };
  const trusted = trustLevel(member) === 'trusted';
  const flags: RiskFlag[] = [];

  for (const key of PROFILE_TEXT_FIELDS) {
    if (raw[key] === undefined) continue;
    const value = typeof raw[key] === 'string' ? tidyDisplayName(raw[key] as string).trim().slice(0, PROFILE_MAX[key]) : '';
    if (value && !trusted && containsContactInfo(value)) {
      await addRiskFlags(member.id, [makeFlag('contact_info', `โปรไฟล์: ${value.slice(0, 60)}`)]);
      throw new MemberAuthError(`บัญชีใหม่ยังใส่ลิงก์ เบอร์โทร หรือไอดีไลน์ในโปรไฟล์ไม่ได้ในช่วง ${NEW_ACCOUNT_DAYS} วันแรก`);
    }
    const terms = riskTermsIn(value);
    if (terms.length) flags.push(makeFlag('risky_text', `โปรไฟล์: ${terms.join(', ')}`));
    next[key] = value || undefined;
  }
  if (Array.isArray(raw.hidden)) {
    next.hidden = raw.hidden.filter((k): k is ProfileFieldKey => typeof k === 'string' && (PROFILE_FIELD_KEYS as readonly string[]).includes(k));
  }
  const updated = await memberRepository.update(member.id, { profile: next });
  await addRiskFlags(member.id, flags);
  return updated;
}

const AGE_BANDS: [number, string][] = [[25, '18–24'], [35, '25–34'], [45, '35–44'], [55, '45–54'], [200, '55+']];

/** What anyone may see of a member: only fields that are filled in and not hidden, and badges that were really checked */
export function publicProfileOf(member: Member, viewer: Member | null) {
  const profile = member.profile ?? { hidden: [...PROFILE_HIDDEN_BY_DEFAULT] };
  const isMe = viewer?.id === member.id;
  const show = (key: ProfileFieldKey) => !profile.hidden.includes(key);
  const prefs = member.preferences;
  const age = prefs?.birthYear ? new Date().getFullYear() - prefs.birthYear : undefined;
  const trust = trustOf(member);
  const about: Partial<Record<ProfileFieldKey, string>> = {};
  for (const key of PROFILE_TEXT_FIELDS) if (profile[key] && show(key)) about[key] = profile[key];
  return {
    id: member.id,
    displayName: tidyDisplayName(member.displayName).trim() || member.displayName,
    avatarUrl: member.avatarUrl,
    memberSince: member.createdAt,
    about,
    gender: prefs?.gender && show('gender') ? prefs.gender : undefined,
    ageBand: age !== undefined && show('age') ? AGE_BANDS.find(([max]) => age < max)?.[1] : undefined,
    province: prefs?.province && show('province') ? prefs.province : undefined,
    interests: prefs && show('interests') ? prefs.interests : undefined,
    // Badges: each one is a fact the server checked
    badges: {
      emailVerified: trust.emailVerified,
      pledged: trust.pledged,
      trusted: trust.level === 'trusted',
      approvedHost: trust.hostStatus === 'approved',
      hostKind: trust.hostStatus === 'approved' ? member.hostApplication?.kind : undefined,
    },
    isMe,
    viewer: viewer && !isMe
      ? { hasBlocked: Boolean(viewer.blockedIds?.includes(member.id)), hasReported: Boolean(member.reportsReceived?.some((r) => r.byId === viewer.id)) }
      : undefined,
  };
}

/* ---------- Host applications ---------- */

export async function submitHostApplication(member: Member, input: unknown): Promise<Member> {
  if (trustLevel(member) === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อน จึงจะส่งคำขอได้', 403);
  if (member.hostApplication?.status === 'approved') throw new MemberAuthError('คุณได้รับอนุมัติแล้ว');
  if (member.hostApplication?.status === 'pending') throw new MemberAuthError('คำขอของคุณกำลังรอทีมงานตรวจ');
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const kind = (['host', 'venue', 'organizer'] as const).find((k) => k === raw.kind);
  if (!kind) throw new MemberAuthError('กรุณาเลือกประเภท');
  const about = typeof raw.about === 'string' ? raw.about.replace(/\s+/g, ' ').trim().slice(0, 600) : '';
  if (about.length < 30) throw new MemberAuthError('เล่าให้ทีมงานฟังอีกนิด อย่างน้อย 30 ตัวอักษร ว่าอยากจัดอะไรและเคยทำอะไรมาบ้าง');
  let link: string | undefined;
  if (typeof raw.link === 'string' && raw.link.trim()) {
    link = raw.link.trim().slice(0, 200);
    if (!/^https:\/\/[^\s]+\.[^\s]+$/i.test(link)) throw new MemberAuthError('ลิงก์ต้องขึ้นต้นด้วย https://');
  }
  const application: HostApplication = { kind, about, link, status: 'pending', submittedAt: new Date().toISOString() };
  const terms = riskTermsIn(about);
  const updated = await memberRepository.update(member.id, { hostApplication: application });
  if (terms.length) await addRiskFlags(member.id, [makeFlag('risky_text', `คำขอโฮสต์: ${terms.join(', ')}`)]);
  return updated;
}

/* ---------- Reports and blocks ---------- */

export const MEMBER_REPORT_REASONS = ['ชวนลงทุน ขายของ หรือขายประกัน', 'โปรไฟล์ปลอมหรือแอบอ้าง', 'คุกคามหรือพูดจาไม่เหมาะสม', 'ขอเงินหรือข้อมูลส่วนตัว', 'อื่นๆ'] as const;

export async function reportMember(reporter: Member, targetId: string, reasonInput: unknown): Promise<void> {
  if (reporter.id === targetId) throw new MemberAuthError('รายงานตัวเองไม่ได้');
  if (trustLevel(reporter) === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นก่อน จึงจะรายงานสมาชิกได้', 403);
  const target = await memberRepository.findById(targetId);
  if (!target) throw new MemberAuthError('ไม่พบสมาชิก', 404);
  if (target.reportsReceived?.some((r) => r.byId === reporter.id)) throw new MemberAuthError('คุณรายงานสมาชิกคนนี้ไปแล้ว ทีมงานกำลังตรวจสอบ', 409);
  const reason = typeof reasonInput === 'string' ? reasonInput.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
  if (reason.length < 3) throw new MemberAuthError('กรุณาเลือกเหตุผล');
  const reports = [...(target.reportsReceived ?? []), { byId: reporter.id, reason, at: new Date().toISOString() }];
  await memberRepository.update(target.id, { reportsReceived: reports });
  await addRiskFlags(target.id, [makeFlag('reported', `${reports.length} คนรายงาน · ล่าสุด: ${reason}`)]);
}

export async function setBlocked(member: Member, targetId: string, blocked: boolean): Promise<Member> {
  if (member.id === targetId) throw new MemberAuthError('บล็อกตัวเองไม่ได้');
  const current = new Set(member.blockedIds ?? []);
  if (blocked) current.add(targetId);
  else current.delete(targetId);
  return memberRepository.update(member.id, { blockedIds: [...current].slice(0, 500) });
}

export { accountAgeDays };
