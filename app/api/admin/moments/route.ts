import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { Moment, momentRepository, MomentStatus } from '@/lib/moments';
import { loadPeople, thaiTimeAgo } from '@/lib/moments/service';
import type { Member } from '@/lib/members';

type Filter = 'all' | 'published' | 'hidden' | 'reported' | 'samples';
const FILTERS = new Set<Filter>(['all', 'published', 'hidden', 'reported', 'samples']);

function toAdminItem(moment: Moment, people: Map<string, Member>) {
  const author = moment.authorId ? people.get(moment.authorId) : undefined;
  return {
    id: moment.id,
    authorId: moment.authorId,
    authorName: author?.displayName ?? moment.authorName,
    authorAvatar: author?.avatarUrl ?? moment.authorAvatar ?? '',
    authorStatus: author?.status ?? (moment.authorId ? 'deleted' : 'sample'),
    caption: moment.caption,
    images: moment.images,
    location: moment.location,
    targetType: moment.targetType,
    targetTitle: moment.targetTitle,
    likesCount: moment.likedBy.length + moment.sampleLikes,
    comments: moment.comments.map((c) => ({
      id: c.id,
      authorName: (c.authorId && people.get(c.authorId)?.displayName) || c.authorName,
      text: c.text,
      hidden: Boolean(c.hidden),
      timeAgo: thaiTimeAgo(c.createdAt),
    })),
    reports: moment.reports.map((r) => ({ reason: r.reason, createdAt: r.createdAt })),
    status: moment.status,
    hiddenBy: moment.hiddenBy,
    moderationNote: moment.moderationNote,
    isSample: moment.isSample,
    createdAt: moment.createdAt,
    timeAgo: thaiTimeAgo(moment.createdAt),
  };
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get('filter') as Filter | null;
  const filter: Filter = filterParam && FILTERS.has(filterParam) ? filterParam : 'all';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(60, Math.max(1, Number.parseInt(searchParams.get('limit') || '24', 10) || 24));

  const statuses: MomentStatus[] = filter === 'published' ? ['published'] : filter === 'hidden' ? ['hidden'] : ['published', 'hidden'];
  const result = await momentRepository.query({
    statuses,
    reportedOnly: filter === 'reported',
    q: searchParams.get('q') || undefined,
    sort: 'newest',
    page: 1,
    limit: 10_000,
  });
  const items = filter === 'samples' ? result.items.filter((m) => m.isSample) : result.items;
  // Reported first in the reported view (most reports on top)
  if (filter === 'reported') items.sort((a, b) => b.reports.length - a.reports.length);
  const pageItems = items.slice((page - 1) * limit, page * limit);
  const people = await loadPeople(pageItems);
  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  return NextResponse.json(
    {
      success: true,
      moments: pageItems.map((m) => toAdminItem(m, people)),
      counts: await momentRepository.counts(),
      pagination: { totalCount: items.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * Moderation actions: hide {id, note} · restore {id} (also clears reports) · dismiss_reports {id}
 * · remove {id} (permanent) · hide_comment / show_comment / delete_comment {id, commentId}
 */
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'community.review');
  if (denied) return denied;
  const actor = getAdminActor(request);
  const body = await request.json().catch(() => ({}));
  const moment = typeof body.id === 'string' ? await momentRepository.findById(body.id) : null;
  if (!moment) return NextResponse.json({ success: false, error: 'ไม่พบโมเมนต์' }, { status: 404 });
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  const label = `"${moment.caption.slice(0, 40)}${moment.caption.length > 40 ? '…' : ''}" ของ ${moment.authorName}`;
  const audit = (action: string, summary: string) => recordAudit(actor, `moment.${action}`, summary, { type: 'moment', id: moment.id });

  switch (body.action) {
    case 'hide': {
      if (!note) return NextResponse.json({ success: false, error: 'กรุณาระบุเหตุผล' }, { status: 400 });
      await momentRepository.mutate(moment.id, (m) => ({ ...m, status: 'hidden', hiddenBy: 'admin', moderationNote: note }));
      audit('hide', `ซ่อนโมเมนต์ ${label} · เหตุผล: ${note}`);
      break;
    }
    case 'restore':
      await momentRepository.mutate(moment.id, (m) => ({ ...m, status: 'published', hiddenBy: undefined, moderationNote: undefined, reports: [] }));
      audit('restore', `คืนการแสดงโมเมนต์ ${label}`);
      break;
    case 'dismiss_reports':
      await momentRepository.mutate(moment.id, (m) => ({ ...m, reports: [] }));
      audit('dismiss_reports', `ยกรายงาน ${moment.reports.length} รายการของโมเมนต์ ${label}`);
      break;
    case 'remove':
      await momentRepository.remove(moment.id);
      audit('remove', `ลบโมเมนต์ ${label}${note ? ` · เหตุผล: ${note}` : ''}`);
      break;
    case 'hide_comment':
    case 'show_comment':
    case 'delete_comment': {
      const comment = moment.comments.find((c) => c.id === body.commentId);
      if (!comment) return NextResponse.json({ success: false, error: 'ไม่พบความคิดเห็น' }, { status: 404 });
      await momentRepository.mutate(moment.id, (m) => ({
        ...m,
        comments: body.action === 'delete_comment'
          ? m.comments.filter((c) => c.id !== comment.id)
          : m.comments.map((c) => (c.id === comment.id ? { ...c, hidden: body.action === 'hide_comment' } : c)),
      }));
      const verb = body.action === 'delete_comment' ? 'ลบ' : body.action === 'hide_comment' ? 'ซ่อน' : 'แสดง';
      audit(body.action, `${verb}ความคิดเห็นของ ${comment.authorName}: "${comment.text.slice(0, 40)}"`);
      break;
    }
    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
