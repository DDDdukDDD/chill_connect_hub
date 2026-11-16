import { NextResponse } from 'next/server';
import { MemberAuthError, NAME_TAKEN_MESSAGE, cleanDisplayName, isNameFree } from '@/lib/members/accounts';
import { getSessionMember } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';

/**
 * ?name=…[&for=new] → { available, message? } while a member types a name (BE-394). The member's own current name counts
 * as available, except with for=new (naming a new sub-account). Signed-in only (onboarding, profile, new sub-account); saving checks again on the server.
 */
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (await isRateLimited(`name-check:${member.id}`, 120, 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'พิมพ์เร็วไปนิด รอสักครู่นะ' }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const raw = params.get('name') ?? '';
  // for=new: a name for a new sub-account, which may not reuse this member's own name either
  const exceptId = params.get('for') === 'new' ? undefined : member.id;
  try {
    const name = cleanDisplayName(raw);
    const available = await isNameFree(name, exceptId);
    return NextResponse.json({ success: true, available, ...(!available && { message: NAME_TAKEN_MESSAGE }) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // Too short, or reads as staff: the same words the save would answer with
    const message = error instanceof MemberAuthError ? error.message : 'ตรวจชื่อไม่สำเร็จ';
    return NextResponse.json({ success: true, available: false, message }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
