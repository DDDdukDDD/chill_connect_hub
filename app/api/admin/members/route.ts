import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { Member, memberRepository, MemberStatus } from '@/lib/members';

const STATUSES = new Set<MemberStatus | 'all'>(['all', 'active', 'suspended', 'banned']);

// Admin view of a member: no password hash or session version
function toAdminMember(member: Member) {
  const { passwordHash, sessionVersion: _version, ...rest } = member;
  void _version;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') as MemberStatus | 'all' | null;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));
  const result = await memberRepository.query({ q: searchParams.get('q'), status: statusParam && STATUSES.has(statusParam) ? statusParam : 'all', page, limit });
  const totalPages = Math.max(1, Math.ceil(result.totalCount / limit));
  return NextResponse.json(
    {
      success: true,
      members: result.items.map(toAdminMember),
      counts: result.counts,
      pagination: { totalCount: result.totalCount, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Actions: set_status {id, status: active|suspended|banned, days? (suspended), reason?} | force_logout {id}
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;
  const actor = getAdminActor(request);
  const body = await request.json().catch(() => ({}));
  const member = typeof body.id === 'string' ? await memberRepository.findById(body.id) : null;
  if (!member) return NextResponse.json({ success: false, error: 'ไม่พบสมาชิก' }, { status: 404 });
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';

  if (body.action === 'set_status') {
    const status = body.status as MemberStatus;
    if (!['active', 'suspended', 'banned'].includes(status)) return NextResponse.json({ success: false, error: 'status ไม่ถูกต้อง' }, { status: 400 });
    if (status !== 'active' && !reason) return NextResponse.json({ success: false, error: 'กรุณาระบุเหตุผล' }, { status: 400 });
    const days = Number(body.days);
    if (status === 'suspended' && !(Number.isInteger(days) && days >= 1 && days <= 365)) {
      return NextResponse.json({ success: false, error: 'ระบุจำนวนวันที่ระงับ 1-365 วัน' }, { status: 400 });
    }
    const updated = await memberRepository.update(member.id, {
      status,
      suspendedUntil: status === 'suspended' ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : undefined,
      statusReason: status === 'active' ? undefined : reason,
      // Suspending or banning ends every session at once
      sessionVersion: status === 'active' ? member.sessionVersion : member.sessionVersion + 1,
    });
    const label = status === 'active' ? 'คืนสถานะ' : status === 'suspended' ? `ระงับ ${days} วัน` : 'แบน';
    recordAudit(actor, `member.${status === 'active' ? 'restore' : status === 'suspended' ? 'suspend' : 'ban'}`, `${label}สมาชิก ${member.displayName}${reason ? ` · เหตุผล: ${reason}` : ''}`, { type: 'member', id: member.id });
    return NextResponse.json({ success: true, member: toAdminMember(updated) });
  }

  if (body.action === 'force_logout') {
    const updated = await memberRepository.update(member.id, { sessionVersion: member.sessionVersion + 1 });
    recordAudit(actor, 'member.force_logout', `บังคับสมาชิก ${member.displayName} ออกจากระบบทุกอุปกรณ์`, { type: 'member', id: member.id });
    return NextResponse.json({ success: true, member: toAdminMember(updated) });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
