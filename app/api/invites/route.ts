import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { MomentError } from '@/lib/moments/service';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { inviteInfo, sendInvites } from '@/lib/social/friendPlans';
import { INVITE_SENDS_PER_HOUR } from '@/lib/social/socialRules';
import { inviteLinkStore } from '@/lib/social/inviteLinkStore';

/**
 * "ชวนไป" from every section (owner 2026-11-11), lib/social/friendPlans.ts.
 * POST { type: 'spot' | 'fair' | 'community' | 'quest' | 'moment', id, to?: [memberId], day?: 'YYYY-MM-DD' } → { invited, link, share, planId?, dateLabel? }:
 *   friends picked (people who follow each other, up to 15 in a plan) get a notice; `link` is the same invitation for
 *   LINE. A ตี้ makes no plan: its link only says who asked.
 * GET ?token= → { invite: InviteInfo | null }: what the banner on the invited page says. Guests may read it. `&open=1`
 *   (the banner's first read after arriving through a link) counts one open for the admin numbers.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (await isRateLimited(`invite-send:${member.id}`, INVITE_SENDS_PER_HOUR, 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'ชวนบ่อยเกินไป ลองใหม่ภายหลังนะ' }, { status: 429 });
  try {
    const body = (await request.json().catch(() => ({}))) as { type?: unknown; id?: unknown; to?: unknown; day?: unknown };
    return NextResponse.json({ success: true, ...(await sendInvites(member, body)) });
  } catch (error) {
    if (error instanceof MemberAuthError || error instanceof MomentError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('[invites] send failed', error);
    return NextResponse.json({ success: false, message: 'ส่งคำชวนไม่สำเร็จ ลองอีกครั้งนะ' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get('token');
  if (token && params.get('open') === '1') void inviteLinkStore.noteOpen(token).catch(() => undefined);
  const reader = await getSessionMember(request);
  return NextResponse.json({ success: true, invite: await inviteInfo(reader, token) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
