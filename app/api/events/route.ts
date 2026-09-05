import { NextResponse } from 'next/server';
import { loadCache, createAdminEvent } from '@/lib/eventsStore';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hasFilterParams = searchParams.has('page') || searchParams.has('limit') || searchParams.has('province') || searchParams.has('type') || searchParams.has('category') || searchParams.has('q') || searchParams.has('zone');

    if (hasFilterParams) {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const eventType = searchParams.get('type') as 'community' | 'public_venue' | 'all' | null;
      const category = searchParams.get('category');
      const province = searchParams.get('province');
      const zone = searchParams.get('zone');
      const venueTag = searchParams.get('venueTag');
      const searchQuery = searchParams.get('q');
      const status = searchParams.get('status') as 'recruiting' | 'full' | 'ended' | null;

      const result = await db.findEvents({
        page,
        limit,
        eventType: eventType || 'all',
        category,
        province,
        zone,
        venueTag,
        searchQuery,
        status: status || 'all',
      });

      return NextResponse.json(
        {
          success: true,
          events: result.items,
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
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
          },
        }
      );
    }

    // Default backward-compatible fallback
    const events = await loadCache();
    const approved = events.filter((ev) => ev.approvalStatus === 'approved');
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
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
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
      const { eventId, participant } = body;
      if (!eventId || !participant || !participant.userId) {
        return NextResponse.json(
          { success: false, message: 'ข้อมูลไม่ครบถ้วน (ต้องการ eventId และข้อมูลผู้ใช้)' },
          { status: 400 }
        );
      }

      const joinResult = await db.atomicJoinEvent(eventId, participant);
      return NextResponse.json(joinResult, {
        status: joinResult.success ? 200 : 409,
      });
    }

    // ── Action: Create Event ──
    const { eventData, userRole } = body;

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

    // Determine Approval Status based on Role and Event Type
    const isAdmin = userRole === 'admin';
    const isPublicVenue = eventData.eventType === 'public_venue';
    
    // Community events by regular members or verified hosts auto-publish
    // Public Fairs by non-admins enter pending review for safety
    const approvalStatus = (isAdmin || !isPublicVenue) ? 'approved' : 'pending';

    const newEventToSave = {
      ...eventData,
      id: eventData.id || `user-event-${Date.now()}`,
      approvalStatus,
      source: isAdmin ? 'Chill & Connect Official' : 'Community Member',
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = await createAdminEvent(newEventToSave);

    return NextResponse.json({
      success: true,
      message: approvalStatus === 'approved' 
        ? 'สร้างกิจกรรมสำเร็จและเผยแพร่บนหน้าแรกเรียบร้อยแล้ว!' 
        : 'ส่งคำขอสร้างกิจกรรมเรียบร้อยแล้ว! ข้อมูลจะแสดงผลหลังผ่านการตรวจสอบจากทีมงาน',
      event: newEventToSave,
      events: updatedEvents,
    });
  } catch (error) {
    console.error('Error in /api/events POST:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
