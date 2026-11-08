import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { COLLECTION_LABELS } from '@/lib/masterData';
import {
  deleteMasterEntry, getMasterData, isMasterCollection, refreshMasterData, reorderMasterEntries, saveMasterEntry, setMasterEntryActive,
} from '@/lib/masterDataStore';

// Every master data collection, including inactive entries
export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request);
  if (denied) return denied;
  await refreshMasterData(true);
  return NextResponse.json({ success: true, ...getMasterData() }, { headers: { 'Cache-Control': 'no-store' } });
}

// Actions: save {collection, item} | set_active {collection, id, active} | delete {collection, id} | reorder {collection, ids}
export async function POST(request: Request) {
  const denied = await requireAdminApiAccess(request, 'master.edit');
  if (denied) return denied;
  const actor = await getAdminActor(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
  await refreshMasterData(true);
  const { action, collection } = body;
  if (!isMasterCollection(collection)) {
    return NextResponse.json({ success: false, error: 'collection ไม่ถูกต้อง' }, { status: 400 });
  }
  const label = COLLECTION_LABELS[collection];

  try {
    if (action === 'save') {
      if (!body.item || typeof body.item !== 'object') return NextResponse.json({ success: false, error: 'ไม่มีข้อมูลรายการ' }, { status: 400 });
      const { entry, created } = await saveMasterEntry(collection, body.item as Record<string, unknown>);
      const name = 'displayName' in entry ? entry.displayName : entry.name;
      recordAudit(actor, created ? 'master.create' : 'master.update', `${created ? 'เพิ่ม' : 'แก้ไข'}${label}: ${name}`, { type: collection, id: entry.id });
      return NextResponse.json({ success: true, entry });
    }
    if (action === 'set_active') {
      if (typeof body.id !== 'string' || typeof body.active !== 'boolean') return NextResponse.json({ success: false, error: 'ต้องระบุ id และ active' }, { status: 400 });
      const entry = await setMasterEntryActive(collection, body.id, body.active);
      recordAudit(actor, 'master.set_active', `${body.active ? 'เปิด' : 'ปิด'}ใช้งาน${label}: ${body.id}`, { type: collection, id: body.id });
      return NextResponse.json({ success: true, entry });
    }
    if (action === 'delete') {
      if (typeof body.id !== 'string') return NextResponse.json({ success: false, error: 'ต้องระบุ id' }, { status: 400 });
      await deleteMasterEntry(collection, body.id);
      recordAudit(actor, 'master.delete', `ลบ${label}: ${body.id}`, { type: collection, id: body.id });
      return NextResponse.json({ success: true });
    }
    if (action === 'reorder') {
      if (!Array.isArray(body.ids) || !body.ids.every((id) => typeof id === 'string')) return NextResponse.json({ success: false, error: 'ต้องระบุ ids' }, { status: 400 });
      await reorderMasterEntries(collection, body.ids as string[]);
      recordAudit(actor, 'master.reorder', `จัดลำดับ${label}ใหม่`, { type: collection });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}
