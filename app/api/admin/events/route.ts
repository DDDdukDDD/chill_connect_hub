import { NextResponse } from 'next/server';
import { actorCan, getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
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

// Fields an editor may change with update_fields. Approval, participants, ids and provenance have their own
// actions (or none), so they cannot be changed around the review flow.
const MUTABLE_EVENT_FIELDS = new Set<string>([
  'title', 'category', 'tag', 'description', 'date', 'endDate', 'time', 'province', 'location', 'zone',
  'meetingPoint', 'locationType', 'onlinePlatform', 'onlineJoinUrl', 'maxParticipants', 'hostName',
  'hostAvatar', 'venueTag', 'price', 'image', 'galleryImages', 'externalUrl', 'sourceUrl', 'link',
  'latitude', 'longitude', 'status', 'rules', 'whatToBring', 'itinerary', 'instructions', 'contactChannel',
  'transportation', 'targetGender', 'targetAge', 'energyLevel', 'isSoloFriendly', 'isPetFriendly',
  'isBeginnerFriendly', 'cancellationPolicy', 'subActivities',
]);

const plainLength = (html: unknown) => (typeof html === 'string' ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length : 0);

/** Platform form rules (AGENTS.md section 3). Checks only the keys present, so partial updates work. */
function getEventValidationError(fields: Record<string, unknown>, eventType: string | undefined, isCreate: boolean): string | null {
  const has = (key: string) => isCreate || key in fields;
  if (has('title') && (typeof fields.title !== 'string' || fields.title.trim().length < 5)) return 'ชื่อกิจกรรมต้องมีอย่างน้อย 5 ตัวอักษร';
  if (has('province') && (typeof fields.province !== 'string' || !fields.province.trim())) return 'กรุณาระบุจังหวัด';
  if (has('location') && (typeof fields.location !== 'string' || !fields.location.trim())) return 'กรุณาระบุสถานที่';
  if (has('description') && plainLength(fields.description) < 15) return 'รายละเอียดต้องมีอย่างน้อย 15 ตัวอักษร';
  if (has('date') && (typeof fields.date !== 'string' || !fields.date.trim())) return 'กรุณาระบุวันที่';
  if (eventType === 'community') {
    if (has('time') && (typeof fields.time !== 'string' || !fields.time.trim())) return 'กรุณาระบุเวลาเริ่ม-จบ';
    const max = Number(fields.maxParticipants);
    if (has('maxParticipants') && !(Number.isInteger(max) && max >= 2 && max <= 15)) return 'จำนวนผู้เข้าร่วมต้องอยู่ระหว่าง 2-15 คน';
  } else if (eventType === 'public_venue') {
    if (has('hostName') && (typeof fields.hostName !== 'string' || !fields.hostName.trim())) return 'กรุณาระบุผู้จัดอย่างเป็นทางการ';
  }
  return null;
}
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
  const denied = requireAdminApiAccess(req, 'community.review');
  if (denied) return denied;
  const actor = getAdminActor(req);

  try {
    const body = await req.json();
    const { action, id, status, updatedFields, autoPublish, eventData } = body;

    // Moderators may only change the approval of community meetups; everything else needs content.edit
    // (reset_and_seed replaces every event, so it needs system.manage)
    const target = typeof id === 'string' ? (await listAdminEvents()).find((ev) => ev.id === id) : undefined;
    const required = action === 'reset_and_seed'
      ? 'system.manage'
      : action === 'update_status' && target?.eventType === 'community' ? 'community.review' : 'content.edit';
    if (!actorCan(actor, required)) {
      return NextResponse.json({ success: false, error: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้', permission: required }, { status: 403 });
    }
    const label = target ? `"${target.title}"` : id;

    if (action === 'create' && eventData) {
      if (eventData.eventType !== 'community' && eventData.eventType !== 'public_venue') {
        return NextResponse.json({ success: false, error: 'eventType must be community or public_venue' }, { status: 400 });
      }
      const createError = getEventValidationError(eventData, eventData.eventType, true);
      if (createError) return NextResponse.json({ success: false, error: createError }, { status: 400 });
      const safeCreate = Object.fromEntries(Object.entries(eventData).filter(([key]) => MUTABLE_EVENT_FIELDS.has(key)));
      const created = await createAdminEvent({
        ...safeCreate,
        eventType: eventData.eventType,
        approvalStatus: eventData.approvalStatus === 'approved' ? 'approved' : 'pending',
        participantsCount: eventData.eventType === 'community' ? 1 : 0,
        createdAtTimestamp: Date.now(),
      } as Parameters<typeof createAdminEvent>[0]);
      recordAudit(actor, 'event.create', `สร้างกิจกรรม "${created.title}"`, { type: 'event', id: created.id });
      const updated = await listAdminEvents();
      return NextResponse.json({
        success: true,
        message: `สร้างกิจกรรม "${eventData.title}" สำเร็จเรียบร้อย!`,
        events: updated,
      });
    }

    if (action === 'reset_and_seed') {
      const result = await resetAndSeedAllEvents();
      recordAudit(actor, 'event.reset_and_seed', `รีเซ็ตกิจกรรมทั้งหมด (${result.totalCount} รายการ)`);
      return NextResponse.json({
        success: true,
        message: `รีเซ็ตและดึงข้อมูลใหม่ทั้งหมดสำเร็จ! โหลดเข้าสู่ระบบ ${result.totalCount} กิจกรรม`,
        events: result.events,
      });
    }

    if (action === 'update_status' && id && status) {
      const updated = await updateEventApproval(id, status);
      recordAudit(actor, `event.${status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'set_pending'}`, `เปลี่ยนสถานะ ${label} เป็น ${status}`, { type: 'event', id });
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'approve_all') {
      const pendingCount = (await listAdminEvents()).filter((ev) => ev.approvalStatus === 'pending').length;
      const updated = await approveAllPendingEvents();
      recordAudit(actor, 'event.approve_all', `อนุมัติกิจกรรมที่รอตรวจทั้งหมด ${pendingCount} รายการ`);
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'delete' && id) {
      const updated = await deleteEvent(id);
      recordAudit(actor, 'event.delete', `ลบกิจกรรม ${label}`, { type: 'event', id });
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'update_fields' && id && updatedFields) {
      if (!target) return NextResponse.json({ success: false, error: 'ไม่พบกิจกรรม' }, { status: 404 });
      const safeFields = Object.fromEntries(Object.entries(updatedFields as Record<string, unknown>).filter(([key]) => MUTABLE_EVENT_FIELDS.has(key)));
      const updateError = getEventValidationError(safeFields, target.eventType, false);
      if (updateError) return NextResponse.json({ success: false, error: updateError }, { status: 400 });
      const updated = await updateAdminEvent(id, safeFields);
      recordAudit(actor, 'event.update', `แก้ไข ${label} (${Object.keys(safeFields).join(', ')})`, { type: 'event', id });
      return NextResponse.json({ success: true, events: updated });
    }

    if (action === 'toggle_auto_publish' && typeof autoPublish === 'boolean') {
      await setAutoPublish(autoPublish);
      recordAudit(actor, 'event.auto_publish', `${autoPublish ? 'เปิด' : 'ปิด'}การเผยแพร่อัตโนมัติ`);
      return NextResponse.json({ success: true, autoPublish });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('ADMIN EVENTS API ERROR:', error);
    return NextResponse.json({ success: false, error: 'Failed to process event action' }, { status: 500 });
  }
}
