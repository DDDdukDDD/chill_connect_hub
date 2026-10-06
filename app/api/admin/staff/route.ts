import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { isStaffRole, ROLE_LABELS, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS, PERMISSION_LABELS, STAFF_ROLES } from '@/lib/permissions';
import { createStaff, findStaffById, listStaff, toPublicStaff, updateStaff } from '@/lib/staffStore';

// Staff accounts and the (read-only) role matrix. Owner only.
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request, 'staff.manage');
  if (denied) return denied;

  return NextResponse.json(
    {
      success: true,
      staff: listStaff().map(toPublicStaff),
      envOwnerEnabled: Boolean(process.env.ADMIN_PASSWORD),
      roles: STAFF_ROLES.map((role) => ({
        id: role,
        label: ROLE_LABELS[role],
        description: ROLE_DESCRIPTIONS[role],
        permissions: ROLE_PERMISSIONS[role],
      })),
      permissionLabels: PERMISSION_LABELS,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Actions: create | set_role | set_status | reset_password | force_logout
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'staff.manage');
  if (denied) return denied;
  const actor = getAdminActor(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { action } = body;

    if (action === 'create') {
      const { email, name, role, password } = body;
      if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string' || !isStaffRole(role)) {
        return NextResponse.json({ success: false, error: 'กรุณากรอกอีเมล ชื่อ role และรหัสผ่านชั่วคราว' }, { status: 400 });
      }
      const account = createStaff({ email, name, role, password, createdBy: actor?.name ?? 'unknown' });
      recordAudit(actor, 'staff.create', `สร้างบัญชี ${account.name} (${ROLE_LABELS[account.role]})`, { type: 'staff', id: account.id });
      return NextResponse.json({ success: true, staff: toPublicStaff(account) });
    }

    const id = typeof body.id === 'string' ? body.id : '';
    const target = findStaffById(id);
    if (!target) return NextResponse.json({ success: false, error: 'ไม่พบบัญชีทีมงาน' }, { status: 404 });
    // Changing your own role or disabling yourself would lock you out mid-session
    if (actor?.id === id && (action === 'set_role' || action === 'set_status')) {
      return NextResponse.json({ success: false, error: 'เปลี่ยน role หรือปิดบัญชีของตัวเองไม่ได้' }, { status: 400 });
    }

    if (action === 'set_role') {
      if (!isStaffRole(body.role)) return NextResponse.json({ success: false, error: 'role ไม่ถูกต้อง' }, { status: 400 });
      const updated = updateStaff(id, { type: 'role', role: body.role });
      recordAudit(actor, 'staff.set_role', `เปลี่ยน role ของ ${target.name}: ${ROLE_LABELS[target.role]} → ${ROLE_LABELS[updated.role]}`, { type: 'staff', id });
      return NextResponse.json({ success: true, staff: toPublicStaff(updated) });
    }

    if (action === 'set_status') {
      if (body.status !== 'active' && body.status !== 'disabled') {
        return NextResponse.json({ success: false, error: 'status ต้องเป็น active หรือ disabled' }, { status: 400 });
      }
      const updated = updateStaff(id, { type: 'status', status: body.status });
      recordAudit(actor, 'staff.set_status', `${updated.status === 'active' ? 'เปิด' : 'ปิด'}บัญชี ${target.name}`, { type: 'staff', id });
      return NextResponse.json({ success: true, staff: toPublicStaff(updated) });
    }

    if (action === 'reset_password') {
      if (typeof body.password !== 'string') return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสผ่านใหม่' }, { status: 400 });
      const updated = updateStaff(id, { type: 'password', password: body.password });
      recordAudit(actor, 'staff.reset_password', `ตั้งรหัสผ่านใหม่ให้ ${target.name}`, { type: 'staff', id });
      return NextResponse.json({ success: true, staff: toPublicStaff(updated) });
    }

    if (action === 'force_logout') {
      const updated = updateStaff(id, { type: 'force_logout' });
      recordAudit(actor, 'staff.force_logout', `บังคับ ${target.name} ออกจากระบบ`, { type: 'staff', id });
      return NextResponse.json({ success: true, staff: toPublicStaff(updated) });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
