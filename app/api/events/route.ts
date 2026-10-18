import { NextResponse } from 'next/server';
import { createAdminEvent } from '@/lib/eventsStore';
import { db } from '@/lib/db';
import { hasAdminCredentials } from '@/lib/adminApiAuth';
import { joinEvent } from '@/lib/members/activity';
import { getSessionMember } from '@/lib/members/session';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardCreator } from '@/lib/members/submissions';
import { prepareSpotTrip } from '@/lib/social/spotTrips';
import type { EventItem } from '@/data/mockData';
import { checkedEventCategories } from '@/lib/eventCategories';

function parsePositiveInteger(value: string | null, fallback: number, max?: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Events a member created. ?mine=1 → the signed-in member's own, any approval status (for My Hub).
    // ?host=<memberId> → that member's approved events (for the public profile).
    const hostId = searchParams.get('host');
    if (searchParams.get('mine') === '1' || hostId) {
      const viewer = hostId ? null : await getSessionMember(request);
      const ownerId = hostId || viewer?.id;
      const created = ownerId
        ? (await db.listAllEvents()).filter((ev) => (ev as { createdByMemberId?: string }).createdByMemberId === ownerId && (!hostId || ev.approvalStatus === 'approved'))
        : [];
      return NextResponse.json(
        { success: true, events: created, total: created.length, ...(!ownerId && { requiresLogin: true }) },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Events created by someone the viewer blocked are left out. That answer is personal, so it is not shared-cached.
    const blocked = new Set((await getSessionMember(request))?.blockedIds ?? []);
    const withoutBlocked = <T extends object>(items: T[]): T[] =>
      blocked.size ? items.filter((ev) => !blocked.has((ev as { createdByMemberId?: string }).createdByMemberId ?? '')) : items;
    const listHeaders = {
      'Cache-Control': blocked.size ? 'private, no-store' : 'public, s-maxage=30, stale-while-revalidate=120',
      Vary: 'Cookie',
    };

    const hasFilterParams = [
      'page', 'limit', 'province', 'type', 'category', 'q', 'zone',
      'venueTag', 'status', 'includeEnded', 'sortBy', 'spotId',
    ].some((param) => searchParams.has(param));

    if (hasFilterParams) {
      const page = parsePositiveInteger(searchParams.get('page'), 1);
      const limit = parsePositiveInteger(searchParams.get('limit'), 50, 100);
      const eventType = searchParams.get('type') as 'community' | 'public_venue' | 'all' | null;
      const category = searchParams.get('category');
      const province = searchParams.get('province');
      const zone = searchParams.get('zone');
      const venueTag = searchParams.get('venueTag');
      const searchQuery = searchParams.get('q');
      const status = searchParams.get('status') as 'recruiting' | 'full' | 'ended' | null;
      const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | 'popular' | 'date' | 'rating' | null;
      const includeEnded = searchParams.get('includeEnded') === 'true' || status === 'ended';

      const result = await db.findEvents({
        page,
        limit,
        eventType: eventType || 'all',
        category,
        province,
        zone,
        venueTag,
        spotId: searchParams.get('spotId'),
        searchQuery,
        status: status || 'all',
        sortBy: sortBy || 'newest',
        includeEnded,
        approvalStatus: 'approved',
      });

      return NextResponse.json(
        {
          success: true,
          events: withoutBlocked(result.items),
          total: result.totalCount,
          pagination: {
            totalCount: result.totalCount,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
            nextCursor: result.nextCursor,
          },
        },
        { headers: listHeaders }
      );
    }

    // Default backward-compatible fallback
    const events = await db.listAllEvents();
    const approved = withoutBlocked(events.filter((ev) => ev.approvalStatus === 'approved'));
    return NextResponse.json(
      {
        success: true,
        total: approved.length,
        events: approved,
        pagination: {
          totalCount: approved.length,
          page: 1,
          limit: approved.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      { headers: listHeaders }
    );
  } catch (error) {
    console.error('Error in /api/events GET:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม' },
      { status: 500 }
    );
  }
}

// Banned / Safety Keywords Filter
const BANNED_KEYWORDS = [
  'เว็บพนัน', 'คาสิโน', 'บาคาร่า', 'สล็อต', 'ลูกโซ่', 'เงินกู้', 'ดอกเบี้ยโหด', 'ยาเสพติด', 'ขายตัว', 'หลอกลวง'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Action: Atomic Join Event (High-Concurrency Safe) ──
    if (body.action === 'join') {
      // Who joins comes from the session, never from the request body (same rules as /api/auth/member/activity)
      const joiner = await getSessionMember(req);
      if (!joiner) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
      if (typeof body.eventId !== 'string' || !body.eventId) {
        return NextResponse.json({ success: false, message: 'ข้อมูลไม่ครบถ้วน (ต้องการ eventId)' }, { status: 400 });
      }
      const joinResult = await joinEvent(joiner, body.eventId);
      const joined = joinResult.status === 'joined' || joinResult.status === 'already_joined';
      return NextResponse.json({ success: joined, ...joinResult, updatedEvent: joinResult.event }, { status: joined ? 200 : joinResult.status === 'not_allowed' ? 403 : 409 });
    }

    // ── Action: Create Event ──
    const { eventData } = body;

    if (!eventData || !eventData.title || !eventData.location) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน กรุณากรอกชื่อกิจกรรมและสถานที่' },
        { status: 400 }
      );
    }

    // Safety Content Screening
    const contentToCheck = `${eventData.title} ${eventData.description || ''} ${eventData.location || ''}`.toLowerCase();
    const hasBannedKeyword = BANNED_KEYWORDS.some((word) => contentToCheck.includes(word));

    if (hasBannedKeyword) {
      return NextResponse.json(
        { success: false, message: 'ขออภัย ตรวจพบข้อความที่ไม่สอดคล้องกับข้อกำหนดความปลอดภัยของคอมมูนิตี้' },
        { status: 400 }
      );
    }

    // Role comes only from a server-verified admin session / token, never from the request body
    const isAdmin = hasAdminCredentials(req);
    const isPublicVenue = eventData.eventType === 'public_venue';

    // Who may publish without review: staff, and members whose host application was approved (community events only).
    // Everything else waits in the admin review queue, so a new account cannot put a meetup in front of people.
    const member = isAdmin ? null : await getSessionMember(req);
    if (!isAdmin) {
      if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
      try {
        guardCreator(member);
      } catch (error) {
        if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        throw error;
      }
      // Fairs come from approved organizers and venues only
      if (isPublicVenue && !(member.hostApplication?.status === 'approved' && ['organizer', 'venue'].includes(member.hostApplication.kind))) {
        return NextResponse.json({ success: false, message: 'งานแฟร์สร้างได้เฉพาะผู้จัดงานหรือเจ้าของพื้นที่ที่ทีมงานอนุมัติแล้ว' }, { status: 403 });
      }
    }
    const isApprovedHost = member?.hostApplication?.status === 'approved' && member.status === 'active';
    // A Spot Buddy trip from a member always waits for staff, approved hosts included
    const approvalStatus = isAdmin || (!isPublicVenue && isApprovedHost && !eventData.spotId) ? 'approved' : 'pending';

    // Members' events carry no private contact channel: people talk in the event's group chat
    if (!isAdmin) delete eventData.contactChannel;

    // Spot Buddy trip: the place must be open for meet-ups and the server sets where, when and how many.
    // Without a spotId these fields are dropped, so a free-form event cannot pose as a trip to a place.
    let tripFields: Partial<EventItem> = { spotId: undefined, spotTitle: undefined, minParticipants: undefined };
    if (eventData.spotId) {
      try {
        tripFields = await prepareSpotTrip(member, eventData);
      } catch (error) {
        if (error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        throw error;
      }
    }

    const savedEvent = await createAdminEvent({
      ...eventData,
      ...tripFields,
      // Only a real, active group is kept; a meetup's mood follows its category
      ...checkedEventCategories(eventData),
      id: eventData.id || `user-event-${Date.now()}`,
      approvalStatus,
      source: isAdmin ? 'Chill & Connect Official' : 'Community Member',
      // Server-verified creator, for staff reviewing the queue (the client cannot set this)
      // The count starts empty: the creator is added just below, and the client's number is not trusted
      ...(member && { createdByMemberId: member.id, participantsCount: 0 }),
      createdAt: new Date().toISOString(),
    });

    // The creator is the first participant of their own event
    const hostJoin = member
      ? await db.atomicJoinEvent(savedEvent.id, { userId: member.id, userName: member.displayName, userAvatar: member.avatarUrl, note: 'host' }).catch(() => undefined)
      : undefined;

    return NextResponse.json({
      success: true,
      message: approvalStatus === 'approved'
        ? 'สร้างกิจกรรมสำเร็จและเผยแพร่บนหน้าแรกเรียบร้อยแล้ว!'
        : 'ส่งคำขอสร้างกิจกรรมเรียบร้อยแล้ว! ข้อมูลจะแสดงผลหลังผ่านการตรวจสอบจากทีมงาน',
      event: hostJoin?.updatedEvent ?? savedEvent,
    });
  } catch (error) {
    console.error('Error in /api/events POST:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
