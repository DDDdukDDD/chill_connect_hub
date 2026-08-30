import { NextResponse } from 'next/server';
import { loadCache, createAdminEvent } from '@/lib/eventsStore';

export async function GET() {
  const events = await loadCache();
  const approved = events.filter((ev) => ev.approvalStatus === 'approved');
  return NextResponse.json({
    success: true,
    total: approved.length,
    events: approved,
  });
}

// Banned / Safety Keywords Filter
const BANNED_KEYWORDS = [
  'เว็บพนัน', 'คาสิโน', 'บาคาร่า', 'สล็อต', 'ลูกโซ่', 'เงินกู้', 'ดอกเบี้ยโหด', 'ยาเสพติด', 'ขายตัว', 'หลอกลวง'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

