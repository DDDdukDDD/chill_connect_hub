import { NextResponse } from 'next/server';
import {
  getAllAdminEvents,
  updateEventApproval,
  approveAllPendingEvents,
  deleteAdminEvent,
  updateAdminEvent,
  setAutoPublish,
  isAutoPublishEnabled,
  resetAndSeedAllEvents,
} from '@/lib/eventsStore';

export async function GET() {
  const events = getAllAdminEvents();
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
    const { action, id, status, updatedFields, autoPublish } = body;

    if (action === 'reset_and_seed') {
      const result = await resetAndSeedAllEvents();
      return NextResponse.json({
        success: true,
        message: `รีเซ็ตและดึงข้อมูลใหม่ทั้งหมดสำเร็จ! โหลดเข้าสู่ระบบ ${result.totalCount} กิจกรรม`,
        events: result.events,
      });
    }

    if (action === 'update_status' && id && status) {
      const updated = updateEventApproval(id, status);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'approve_all') {
      const updated = approveAllPendingEvents();
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'delete' && id) {
      const updated = deleteAdminEvent(id);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'update_fields' && id && updatedFields) {
      const updated = updateAdminEvent(id, updatedFields);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'toggle_auto_publish' && typeof autoPublish === 'boolean') {
      setAutoPublish(autoPublish);
      return NextResponse.json({ success: true, autoPublish });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
