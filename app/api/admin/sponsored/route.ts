import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { isClosedToJoin, isEventEnded } from '@/lib/dateUtils';
import { db } from '@/lib/db';
import { listPublicFairs, listPublicMeetups, listPublicQuests } from '@/lib/publicContent';
import { SponsoredError, deleteSponsoredSlot, listSponsoredSlots, saveSponsoredSlot } from '@/lib/sponsored/store';
import { SPONSOR_PILLAR_LABELS, type SponsorPillar } from '@/lib/sponsored/types';

type Option = { id: string; title: string; detail?: string };

/** What each list page can show in its sponsored slot: what the page itself lists today */
async function optionsOf(pillar: SponsorPillar): Promise<Option[]> {
  if (pillar === 'community') {
    return (await listPublicMeetups()).filter((e) => !isClosedToJoin(e)).map((e) => ({ id: e.id, title: e.title, detail: [e.date, e.province].filter(Boolean).join(' · ') }));
  }
  if (pillar === 'events') {
    return (await listPublicFairs()).filter((e) => !isEventEnded(e)).map((e) => ({ id: e.id, title: e.title, detail: [e.date, e.province].filter(Boolean).join(' · ') }));
  }
  if (pillar === 'challenges') {
    return (await listPublicQuests()).filter((q) => q.status !== 'ended').map((q) => ({ id: q.id, title: q.title }));
  }
  // Every place in the catalog (the query engine returns at most 100 a page)
  const spots: Option[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await db.findSpots({ page, limit: 100 });
    spots.push(...result.items.map((s) => ({ id: s.id, title: s.title, detail: s.province })));
    if (!result.hasNextPage) break;
  }
  return spots;
}

// The slots, plus the items each page can show (for the form's search)
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  try {
    const [community, events, spots, challenges] = await Promise.all([optionsOf('community'), optionsOf('events'), optionsOf('spots'), optionsOf('challenges')]);
    return NextResponse.json({ success: true, slots: listSponsoredSlots(), options: { community, events, spots, challenges } });
  } catch (error) {
    console.error('Sponsored slots load failed:', error);
    return NextResponse.json({ success: false, error: 'โหลดการ์ดสนับสนุนไม่สำเร็จ' }, { status: 500 });
  }
}

// { action: 'save', slot } (new when slot.id is empty) · { action: 'delete', id }
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'content.edit');
  if (denied) return denied;
  const actor = getAdminActor(request);
  try {
    const body = await request.json();
    if (body?.action === 'save' && body.slot && typeof body.slot === 'object') {
      const isNew = !body.slot.id;
      const slot = await saveSponsoredSlot(body.slot, async (pillar) => new Set((await optionsOf(pillar)).map((o) => o.id)));
      recordAudit(actor, isNew ? 'sponsored.create' : 'sponsored.update', `${isNew ? 'เพิ่ม' : 'แก้ไข'}การ์ดสนับสนุนหน้า${SPONSOR_PILLAR_LABELS[slot.pillar]} (${slot.sponsor})`, { type: 'sponsored', id: slot.id });
      return NextResponse.json({ success: true, slot });
    }
    if (body?.action === 'delete' && typeof body.id === 'string') {
      const slot = await deleteSponsoredSlot(body.id);
      recordAudit(actor, 'sponsored.delete', `ลบการ์ดสนับสนุน ${slot?.sponsor ?? body.id}`, { type: 'sponsored', id: body.id });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof SponsoredError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    console.error('Sponsored slot save failed:', error);
    return NextResponse.json({ success: false, error: 'บันทึกการ์ดสนับสนุนไม่สำเร็จ' }, { status: 500 });
  }
}
