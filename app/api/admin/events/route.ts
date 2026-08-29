import { NextResponse } from 'next/server';
import {
  loadCache,
  updateEventApproval,
  approveAllPendingEvents,
  deleteEvent,
  updateAdminEvent,
  createAdminEvent,
  setAutoPublish,
  isAutoPublishEnabled,
  resetAndSeedAllEvents,
} from '@/lib/eventsStore';

export async function GET() {
  const events = await loadCache();
  const autoPublish = isAutoPublishEnabled();
  return NextResponse.json({
    success: true,
    total: events.length,
    autoPublish,
    events,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, status, updatedFields, autoPublish, eventData } = body;

    if (action === 'create' && eventData) {
      const updated = await createAdminEvent(eventData);
      return NextResponse.json({
        success: true,
        message: `สร้างกิจกรรม "${eventData.title}" สำเร็จเรียบร้อย!`,
        events: updated,
      });
    }

    if (action === 'reset_and_seed') {
      const result = await resetAndSeedAllEvents();
      return NextResponse.json({
        success: true,
        message: `รีเซ็ตและดึงข้อมูลใหม่ทั้งหมดสำเร็จ! โหลดเข้าสู่ระบบ ${result.totalCount} กิจกรรม`,
        events: result.events,
      });
    }

    if (action === 'update_status' && id && status) {
      const updated = await updateEventApproval(id, status);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'approve_all') {
      const updated = await approveAllPendingEvents();
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'delete' && id) {
      const updated = await deleteEvent(id);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'update_fields' && id && updatedFields) {
      const updated = await updateAdminEvent(id, updatedFields);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'toggle_auto_publish' && typeof autoPublish === 'boolean') {
      await setAutoPublish(autoPublish);
      return NextResponse.json({ success: true, autoPublish });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('ADMIN EVENTS API ERROR:', error);
    return NextResponse.json({ success: false, error: (error as Error).message, stack: (error as Error).stack }, { status: 500 });
  }
}
