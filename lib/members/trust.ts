import type { Member, MemberTrust, RiskFlag, RiskFlagCode, TrustLevel } from './types';

/**
 * Trust and safety for member accounts.
 *
 * Idea: sign-up cannot stop a determined scammer, so a new account can do little, and earns more by
 * proving itself. Three levels:
 *   new      → just signed up
 *   verified → email verified and the community pledge accepted (may post and comment, with limits)
 *   trusted  → verified, at least NEW_ACCOUNT_DAYS old, and no open risk flag (normal limits, contact
 *              details allowed), or an approved host
 * Badges on a profile come only from these facts; nothing is shown that was not checked.
 * This file has no server-only imports, so the browser may use it too.
 */
export const PLEDGE_VERSION = '2026-10';
export const NEW_ACCOUNT_DAYS = 7;
/** Daily limits while an account is not yet trusted */
export const NEW_ACCOUNT_LIMITS = { momentsPerDay: 3, commentsPerDay: 20 };

const DAY = 24 * 60 * 60 * 1000;

export function accountAgeDays(member: Member): number {
  return Math.floor((Date.now() - new Date(member.createdAt).getTime()) / DAY);
}

export function hasOpenRisk(member: Member): boolean {
  const reviewed = member.riskReviewedAt ? new Date(member.riskReviewedAt).getTime() : 0;
  const newFlag = (member.riskFlags ?? []).some((f) => new Date(f.at).getTime() > reviewed);
  const newReport = (member.reportsReceived ?? []).some((r) => new Date(r.at).getTime() > reviewed);
  return newFlag || newReport;
}

export function trustLevel(member: Member): TrustLevel {
  const verified = member.emailVerified && Boolean(member.pledgeAcceptedAt);
  if (!verified) return 'new';
  if (hasOpenRisk(member)) return 'verified';
  if (member.hostApplication?.status === 'approved') return 'trusted';
  return accountAgeDays(member) >= NEW_ACCOUNT_DAYS ? 'trusted' : 'verified';
}

export function trustOf(member: Member): MemberTrust {
  return {
    level: trustLevel(member),
    emailVerified: member.emailVerified,
    hasEmail: Boolean(member.email),
    pledged: Boolean(member.pledgeAcceptedAt),
    hostStatus: member.hostApplication?.status ?? 'none',
    accountDays: accountAgeDays(member),
  };
}

/* ---------- Text checks ---------- */

// Contact details that move a conversation off the platform: links, phone numbers, LINE / Telegram ids
const CONTACT_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]+\.(com|net|org|co|io|me|ly|gg|xyz|shop|site|online|app|link|biz|info|cc|th)\b/i,
  /(?:\+?66|0)[\s-]?[689](?:[\s.-]?\d){8}/, // Thai mobile numbers
  /(?:\d[\s.-]?){9,}/, // any long run of digits
  /(?:line|ไลน์|ไอดีไลน์|แอดไลน์|telegram|เทเลแกรม|whatsapp|wechat)\s*(?:id|ไอดี)?\s*[:=@]?\s*[@a-z0-9._-]{3,}/i,
  /@[a-z0-9._]{4,}/i,
];

export function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some((re) => re.test(text));
}

// Words typical of sales, investment and loan approaches. A match flags the account for staff; it does not block.
const RISK_TERMS = [
  'ลงทุน', 'ปันผล', 'ผลตอบแทน', 'กำไรต่อวัน', 'รายได้เสริม', 'รายได้พิเศษ', 'งานออนไลน์', 'ทำงานที่บ้าน', 'เทรด', 'ฟอเร็กซ์', 'forex', 'คริปโต', 'crypto',
  'ประกันชีวิต', 'ขายประกัน', 'ตัวแทนประกัน', 'สินเชื่อ', 'เงินกู้', 'กู้เงิน', 'เงินด่วน', 'ปล่อยกู้', 'แชร์ลูกโซ่', 'ธุรกิจเครือข่าย', 'mlm', 'ขายตรง',
  'เว็บพนัน', 'คาสิโน', 'บาคาร่า', 'สล็อต', 'แทงบอล', 'โอนเงิน', 'เลขบัญชี', 'รับสมัครตัวแทน', 'หาคู่', 'sugar', 'เลี้ยงดู',
];

export function riskTermsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return RISK_TERMS.filter((term) => lower.includes(term));
}

// Throwaway mailbox services often used for bulk sign-ups
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'emailondeck.com', 'mohmal.com', 'tempail.com', 'moakt.com',
]);

export function isDisposableEmail(email: string | undefined): boolean {
  const domain = email?.split('@')[1]?.toLowerCase();
  return Boolean(domain && DISPOSABLE_DOMAINS.has(domain));
}

export function makeFlag(code: RiskFlagCode, detail: string): RiskFlag {
  return { code, detail: detail.slice(0, 160), at: new Date().toISOString() };
}

export const RISK_FLAG_LABELS: Record<RiskFlagCode, string> = {
  disposable_email: 'ใช้อีเมลแบบใช้แล้วทิ้ง',
  shared_ip: 'หลายบัญชีสมัครจากที่เดียวกัน',
  risky_name: 'ชื่อมีคำเสี่ยงหรือช่องทางติดต่อ',
  risky_text: 'ข้อความมีคำเสี่ยง (ขาย ลงทุน กู้เงิน)',
  contact_info: 'พยายามใส่ช่องทางติดต่อขณะเป็นบัญชีใหม่',
  reported: 'ถูกสมาชิกรายงาน',
};
