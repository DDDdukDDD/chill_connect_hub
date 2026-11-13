import { NextResponse } from 'next/server';
import { MemberAuthError } from '@/lib/members/accounts';
import { activityOf, forgetCancelled, joinEvent, leaveEvent, markMissed, setSaved } from '@/lib/members/activity';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { traceAction } from '@/lib/social/actionLog';

const EMPTY = { joined: [], hosted: [], cancelled: [], joinedIds: [], savedSpotIds: [], savedEventIds: [], reviewedEventIds: [], fairGroups: [] };

// The signed-in member's events and saved places: { joined, hosted, cancelled, joinedIds, savedSpotIds, savedEventIds }
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: true, requiresLogin: true, ...EMPTY }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ success: true, ...(await activityOf(member)) }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * { action: 'join' | 'leave' | 'forget_cancelled', eventId, date? (YYYY-MM-DD, one date of a recurring ตี้) }
 * { action: 'missed', eventId, missed: boolean } (ended event without a host check-in)
 * { action: 'save' | 'unsave', kind: 'spot' | 'event', id }
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const eventId = typeof body.eventId === 'string' ? body.eventId : '';
  try {
    if (body.action === 'join') {
      if (await isRateLimited(`event-join:${member.id}`, 40, 60 * 60 * 1000)) {
        return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
      }
      const result = await joinEvent(member, eventId, typeof body.date === 'string' ? body.date : undefined);
      const ok = result.status === 'joined' || result.status === 'already_joined';
      // Credited to the post or profile the member came from (docs/TRACEABILITY.md); the series id is what the link named
      if (result.status === 'joined') await traceAction(member, 'join', { type: result.event?.eventType === 'community' ? 'community' : 'fair', ref: eventId });
      const status = ok ? 200 : result.status === 'not_found' ? 404 : result.status === 'not_allowed' ? 403 : 409;
      return NextResponse.json({ success: ok, ...result }, { status });
    }
    if (body.action === 'leave') {
      const result = await leaveEvent(member, eventId);
      return NextResponse.json({ success: true, ...result });
    }
    if (body.action === 'missed' && typeof body.missed === 'boolean') {
      await markMissed(member, eventId, body.missed);
      return NextResponse.json({ success: true });
    }
    if (body.action === 'forget_cancelled') {
      await forgetCancelled(member, eventId);
      return NextResponse.json({ success: true });
    }
    if ((body.action === 'save' || body.action === 'unsave') && (body.kind === 'spot' || body.kind === 'event')) {
      const savedId = typeof body.id === 'string' ? body.id : '';
      const updated = await setSaved(member, body.kind, savedId, body.action === 'save');
      if (body.action === 'save') await traceAction(member, 'save', { type: body.kind === 'spot' ? 'spot' : 'fair', ref: savedId });
      return NextResponse.json({ success: true, savedSpotIds: updated.savedSpotIds ?? [], savedEventIds: updated.savedEventIds ?? [] });
    }
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}
