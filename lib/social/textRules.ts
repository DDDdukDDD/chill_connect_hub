import { MemberAuthError } from '../members/accounts';
import { addRiskFlags } from '../members/safety';
import { containsContactInfo, makeFlag, NEW_ACCOUNT_DAYS, riskTermsIn, trustLevel } from '../members/trust';
import type { Member } from '../members/types';

/**
 * Rule for short texts members send each other (chat messages, meet-up groups):
 * only verified accounts may write; accounts that are not yet trusted cannot send links, phone numbers or LINE ids;
 * risky words raise a flag for staff but do not stop the message.
 */
export async function guardMemberText(member: Member, text: string, where: string): Promise<void> {
  const level = trustLevel(member);
  if (level === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อนนะ (ดูที่หน้าโปรไฟล์)', 403);
  if (level !== 'trusted' && containsContactInfo(text)) {
    await addRiskFlags(member.id, [makeFlag('contact_info', `${where}: ${text.slice(0, 80)}`)]);
    throw new MemberAuthError(`บัญชีใหม่ยังส่งลิงก์ เบอร์โทร หรือไอดีไลน์ไม่ได้ในช่วง ${NEW_ACCOUNT_DAYS} วันแรก`, 403);
  }
  const terms = riskTermsIn(text);
  if (terms.length) await addRiskFlags(member.id, [makeFlag('risky_text', `${where}: ${terms.join(', ')}`)]);
}
