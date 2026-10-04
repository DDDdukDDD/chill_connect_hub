import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import {
  listAdminEvents,
  updateEventApproval,
  approveAllPendingEvents,
  deleteEvent,
  updateAdminEvent,
  createAdminEvent,
  setAutoPublish,
  getAutoPublish,
  resetAndSeedAllEvents,
  queryAdminEvents,
} from '@/lib/eventsStore';

const EVENT_TYPES = new Set(['community', 'public_venue', 'all']);
const APPROVAL_STATUSES = new Set(['pending', 'approved', 'rejected', 'all']);
const EVENT_FORMATS = new Set(['recurring', 'online', 'physical', 'all']);

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function pickParam<T extends string>(value: string | null, allowed: Set<string>, fallback: T): T {
  return value && allowed.has(value) ? (value as T) : fallback;
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);

  // Paginated moderation mode (used by the moderation views)
  if (searchParams.has('page')) {
    const result = await queryAdminEvents({
      type: pickParam(searchParams.get('type'), EVENT_TYPES, 'all'),
      status: pickParam(searchParams.get('status'), APPROVAL_STATUSES, 'all'),
      format: pickParam(searchParams.get('format'), EVENT_FORMATS, 'all'),
      q: searchParams.get('q'),
      page: parsePositiveInteger(searchParams.get('page'), 1, 10_000),
      limit: parsePositiveInteger(searchParams.get('limit'), 20, 100),
    });
    return NextResponse.json({
      success: true,
      events: result.items,
      counts: result.counts,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  }

  // Full list (dashboard, scraper and provinces views)
  const [events, autoPublish] = await Promise.all([listAdminEvents(), getAutoPublish()]);
  return NextResponse.json({
    success: true,
    total: events.length,
    autoPublish,
    events,
  });
}

export async function POST(req: Request) {
  const denied = requireAdminApiAccess(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { action, id, status, updatedFields, autoPublish, eventData } = body;

    if (action === 'create' && eventData) {
      await createAdminEvent(eventData);
      const updated = await listAdminEvents();
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
    return NextResponse.json({ success: false, error: 'Failed to process event action' }, { status: 500 });
  }
}
