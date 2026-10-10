import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { tidyDisplayName } from '@/lib/displayName';
import { Member, memberRepository, MemberStatus } from '@/lib/members';
import { exportableAccount } from '@/lib/members/accounts';
import { isMailerConfigured } from '@/lib/members/mailer';
import { providerStatus } from '@/lib/members/oauth';
import { getSessionSecret } from '@/lib/members/session';
import { hasOpenRisk, trustOf } from '@/lib/members/trust';
import { momentRepository } from '@/lib/moments';
import { roleHasPermission } from '@/lib/permissions';

const STATUSES = new Set<MemberStatus | 'all'>(['all', 'active', 'suspended', 'banned']);

// Admin view of a member: no password hash or session version
function toAdminMember(member: Member) {
  const { passwordHash, sessionVersion: _version, passwordReset: _reset, emailVerification: _verify, signupIpHash: _ip, ...rest } = member;
  void _version;
  void _reset;
  void _verify;
  void _ip;
  return {
    ...rest,
    displayName: tidyDisplayName(rest.displayName).trim() || rest.displayName,
    hasPassword: Boolean(passwordHash),
    trust: trustOf(member),
    hasOpenRisk: hasOpenRisk(member),
  };
}

/** Numbers for the top of the members page, and whether the member system is fully set up */
async function overview() {
  const { items } = await memberRepository.query({ status: 'all', page: 1, limit: 100_000 });
  const count = (test: (m: Member) => boolean) => items.filter(test).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const interestTotals: Record<string, number> = {};
  for (const m of items) {
    const i = m.preferences?.interests;
    for (const id of [...(i?.communityCategories ?? []), ...(i?.spotVibes ?? []), ...(i?.fairCategories ?? [])]) interestTotals[id] = (interestTotals[id] ?? 0) + 1;
  }
  return {
    total: items.length,
    newThisWeek: count((m) => new Date(m.createdAt).getTime() >= weekAgo),
    onboarded: count((m) => Boolean(m.onboardedAt)),
    wantsToHost: count((m) => Boolean(m.preferences && m.preferences.intent !== 'member')),
    emailVerified: count((m) => m.emailVerified),
    pledged: count((m) => Boolean(m.pledgeAcceptedAt)),
    flagged: count(hasOpenRisk),
    pendingHosts: count((m) => m.hostApplication?.status === 'pending'),
    byMethod: {
      email: count((m) => Boolean(m.passwordHash)),
      google: count((m) => m.providers.some((p) => p.provider === 'google')),
      facebook: count((m) => m.providers.some((p) => p.provider === 'facebook')),
      apple: count((m) => m.providers.some((p) => p.provider === 'apple')),
    },
    topInterests: Object.entries(interestTotals).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, members]) => ({ id, members })),
    readiness: {
      sessionSecret: Boolean(getSessionSecret()),
      providers: providerStatus(),
      mailer: isMailerConfigured(),
      // JSON files on a serverless host are temporary: accounts vanish on redeploy or instance change
      durableStorage: !process.env.VERCEL,
    },
  };
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;
  const { searchParams } = new URL(request.url);

  if (searchParams.get('view') === 'overview') {
    return NextResponse.json({ success: true, overview: await overview() }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // PDPA access request handled by staff: download everything stored about one member
  const exportId = searchParams.get('export');
  if (exportId) {
    const member = await memberRepository.findById(exportId);
    if (!member) return NextResponse.json({ success: false, error: 'ไม่พบสมาชิก' }, { status: 404 });
    const { items: ownMoments } = await momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 10_000 });
    recordAudit(getAdminActor(request), 'member.export', `ดาวน์โหลดข้อมูลของสมาชิก (คำขอข้อมูลส่วนบุคคล)`, { type: 'member', id: member.id });
    return NextResponse.json(
      {
        success: true,
        exportedAt: new Date().toISOString(),
        account: exportableAccount(member),
        moments: ownMoments.map((m) => ({ id: m.id, caption: m.caption, images: m.images, location: m.location, status: m.status, createdAt: m.createdAt, likes: m.likedBy.length, comments: m.comments.length })),
      },
      { headers: { 'Content-Disposition': `attachment; filename="member-${member.id}.json"`, 'Cache-Control': 'no-store' } }
    );
  }

  const statusParam = searchParams.get('status') as MemberStatus | 'all' | null;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));

  // Review queues: ?queue=flagged (open risk flags or reports) · ?queue=hosts (pending host applications)
  const queue = searchParams.get('queue');
  if (queue === 'flagged' || queue === 'hosts') {
    const all = await memberRepository.query({ q: searchParams.get('q'), status: 'all', page: 1, limit: 100_000 });
    const items = all.items.filter((m) => (queue === 'flagged' ? hasOpenRisk(m) : m.hostApplication?.status === 'pending'));
    const totalPages = Math.max(1, Math.ceil(items.length / limit));
    return NextResponse.json(
      {
        success: true,
        members: items.slice((page - 1) * limit, page * limit).map(toAdminMember),
        counts: all.counts,
        pagination: { totalCount: items.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
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
// | delete {id, reason, confirmName} (needs staff.manage: permanent, for PDPA erasure requests)
// | clear_flags {id, note?} (flags and reports looked at, nothing wrong)
// | host_decision {id, decision: approve|reject, note? (required to reject)}
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

  if (body.action === 'clear_flags') {
    const updated = await memberRepository.update(member.id, { riskReviewedAt: new Date().toISOString() });
    recordAudit(actor, 'member.clear_flags', `ตรวจธงเตือนของสมาชิก ${member.displayName} แล้ว ไม่พบปัญหา${reason ? ` · ${reason}` : ''}`, { type: 'member', id: member.id });
    return NextResponse.json({ success: true, member: toAdminMember(updated) });
  }

  if (body.action === 'host_decision') {
    const application = member.hostApplication;
    if (!application) return NextResponse.json({ success: false, error: 'สมาชิกคนนี้ไม่ได้ส่งคำขอ' }, { status: 400 });
    const approve = body.decision === 'approve';
    if (!approve && body.decision !== 'reject') return NextResponse.json({ success: false, error: 'decision ไม่ถูกต้อง' }, { status: 400 });
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    if (!approve && !note) return NextResponse.json({ success: false, error: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ สมาชิกจะเห็นข้อความนี้' }, { status: 400 });
    const updated = await memberRepository.update(member.id, {
      hostApplication: { ...application, status: approve ? 'approved' : 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: actor?.name, note: note || undefined },
    });
    recordAudit(actor, approve ? 'member.host_approve' : 'member.host_reject', `${approve ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอเป็นโฮสต์ของ ${member.displayName}${note ? ` · ${note}` : ''}`, { type: 'member', id: member.id });
    return NextResponse.json({ success: true, member: toAdminMember(updated) });
  }

  if (body.action === 'delete') {
    if (!actor || !roleHasPermission(actor.role, 'staff.manage')) {
      return NextResponse.json({ success: false, error: 'เฉพาะ Owner เท่านั้นที่ลบบัญชีสมาชิกได้' }, { status: 403 });
    }
    if (!reason) return NextResponse.json({ success: false, error: 'กรุณาระบุเหตุผล เช่น เลขที่คำขอของสมาชิก' }, { status: 400 });
    if (body.confirmName !== (tidyDisplayName(member.displayName).trim() || member.displayName)) return NextResponse.json({ success: false, error: 'พิมพ์ชื่อสมาชิกให้ตรงเพื่อยืนยัน' }, { status: 400 });
    const removedMoments = await momentRepository.removeByAuthor(member.id);
    const removedComments = await momentRepository.removeCommentsByAuthor(member.id);
    await memberRepository.remove(member.id);
    // The audit entry keeps the id and the reason, not the member's name or email
    recordAudit(actor, 'member.delete', `ลบบัญชีสมาชิกถาวร (โมเมนต์ ${removedMoments} คอมเมนต์ ${removedComments}) · เหตุผล: ${reason}`, { type: 'member', id: member.id });
    return NextResponse.json({ success: true, removedMoments, removedComments });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
