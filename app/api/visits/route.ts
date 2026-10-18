import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { VISIT_POINTS, progressOf, rewardsForTargets } from '@/lib/social/questProgress';
import { monthOf } from '@/lib/social/myMonth';
import { rewardsOf } from '@/lib/social/rewardsLedger';
import { type VisitTargetType, isVisitTargetType, markVisit, markedVisitOf, marksOf, socialProofFor, targetKey, unmarkVisit } from '@/lib/social/visits';

const MAX_TARGETS = 40;

/**
 * GET ?targets=spot:ID,community:ID,fair:ID  who has been to each target and what going earns (public)
 * GET ?mine=1                                the signed-in member's visits, own marks, challenge progress and points
 *     &month=1                               adds `month`: this month's places and fairs (Chill) and meetups (Connect)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('mine') === '1') {
      const headers = { 'Cache-Control': 'private, no-store' };
      const member = await getSessionMember(request);
      if (!member) {
        return NextResponse.json({ success: true, requiresLogin: true, visits: [], marks: [], quests: [], points: { total: 0, fromVisits: 0, fromQuests: 0 } }, { headers });
      }
      const [progress, month] = await Promise.all([progressOf(member.id), searchParams.get('month') === '1' ? monthOf(member.id) : null]);
      return NextResponse.json({ success: true, ...progress, marks: marksOf(member.id), ...(month && { month }) }, { headers });
    }

    const targets = (searchParams.get('targets') ?? '')
      .split(',')
      .map((pair) => {
        const at = pair.indexOf(':');
        return { targetType: pair.slice(0, at), targetId: pair.slice(at + 1) };
      })
      .filter((t): t is { targetType: VisitTargetType; targetId: string } => isVisitTargetType(t.targetType) && t.targetId !== '')
      .slice(0, MAX_TARGETS);

    const [proofs, rewards] = await Promise.all([socialProofFor(targets), rewardsForTargets(targets)]);
    const result = Object.fromEntries(Object.keys(proofs).map((key) => [key, { ...proofs[key], quests: rewards[key] ?? [] }]));
    return NextResponse.json(
      { success: true, pointsPerVisit: VISIT_POINTS, targets: result },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  } catch (error) {
    console.error('Error in /api/visits GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to load visits' }, { status: 500 });
  }
}

/**
 * { action: 'mark', targetType: 'spot' | 'fair', targetId, rating? }   "I have been here" (rating 1 to 5 is optional)
 * { action: 'unmark', targetType, targetId }
 * A community event is not marked by hand: the host's check-in is its evidence.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const targetType = body.targetType;
    const targetId = typeof body.targetId === 'string' ? body.targetId : '';
    if ((targetType !== 'spot' && targetType !== 'fair') || !targetId) {
      return NextResponse.json({ success: false, message: 'บันทึกได้เฉพาะที่เที่ยวและงานแฟร์' }, { status: 400 });
    }

    if (body.action === 'unmark') {
      await unmarkVisit(member.id, targetType, targetId);
    } else if (body.action === 'mark') {
      if (isRateLimited(`visit-mark:${member.id}`, 30, 60 * 60 * 1000)) {
        return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
      }
      if (targetType === 'spot') {
        const spot = await db.findSpotById(targetId);
        if (!spot || spot.publicationStatus === 'draft') return NextResponse.json({ success: false, message: 'ไม่พบสถานที่นี้' }, { status: 404 });
      } else {
        const fair = await db.findEventById(targetId);
        if (!fair || fair.eventType !== 'public_venue') return NextResponse.json({ success: false, message: 'ไม่พบงานนี้' }, { status: 404 });
        if (parseEventDateToTimestamp(fair.date) > Date.now()) {
          return NextResponse.json({ success: false, message: 'งานนี้ยังไม่เริ่ม บันทึกได้เมื่อถึงวันงาน' }, { status: 400 });
        }
      }
      let rating: number | undefined;
      if (body.rating !== undefined && body.rating !== null) {
        rating = Math.round(Number(body.rating));
        if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ success: false, message: 'ให้คะแนน 1 ถึง 5 ดาว' }, { status: 400 });
      }
      await markVisit(member.id, targetType, targetId, rating);
      await rewardsOf(member.id);
    } else {
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
    }

    const target = { targetType, targetId } as const;
    const [proofs, progress] = await Promise.all([socialProofFor([target]), progressOf(member.id)]);
    return NextResponse.json({
      success: true,
      mark: markedVisitOf(member.id, targetType, targetId) ?? null,
      proof: proofs[targetKey(targetType, targetId)],
      points: progress.points,
      quests: progress.quests,
    });
  } catch (error) {
    console.error('Error in /api/visits POST:', error);
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}
