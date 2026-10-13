import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { MemberAuthError } from '@/lib/members/accounts';
import { moderateStory, storiesForStaff } from '@/lib/social/stories';

// Every story still inside its 24 hours (hidden ones included), most reported first
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  const stories = await storiesForStaff();
  return NextResponse.json(
    { success: true, stories, counts: { active: stories.length, reported: stories.filter((s) => s.reports.length > 0).length, hidden: stories.filter((s) => s.hidden).length } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/** Moderation actions: remove {id} (permanent) · hide {id} (until it expires) · restore {id} (shows it again and clears its reports) */
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'community.review');
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  if (typeof body.id !== 'string' || (action !== 'remove' && action !== 'hide' && action !== 'restore')) {
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
  try {
    const story = await moderateStory(body.id, action);
    const verb = action === 'remove' ? 'ลบ' : action === 'hide' ? 'ซ่อน' : 'คืนการแสดง';
    recordAudit(getAdminActor(request), `story.${action}`, `${verb}สตอรี่${story.caption ? ` "${story.caption.slice(0, 40)}"` : ''} (${story.reports?.length ?? 0} รายงาน)`, { type: 'story', id: story.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MemberAuthError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    return NextResponse.json({ success: false, error: 'ทำรายการไม่สำเร็จ' }, { status: 500 });
  }
}
