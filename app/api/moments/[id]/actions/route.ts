import { NextResponse } from 'next/server';
import { addComment, deleteComment, loadPeople, MomentError, reportMoment, setLike, setSaved, toFeedItem } from '@/lib/moments/service';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';

/**
 * Member actions on a moment:
 * { action: 'like' | 'unlike' | 'save' | 'unsave' }
 * { action: 'comment', text } · { action: 'delete_comment', commentId }
 * { action: 'report', reason }
 * Returns the updated feed item (for report: also { autoHidden }).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    let moment;
    let autoHidden = false;
    switch (body.action) {
      case 'like':
      case 'unlike':
        moment = await setLike(member, id, body.action === 'like');
        break;
      case 'save':
      case 'unsave':
        moment = await setSaved(member, id, body.action === 'save');
        break;
      case 'comment':
        if (isRateLimited(`moment-comment:${member.id}`, 30, 10 * 60 * 1000)) {
          return NextResponse.json({ success: false, message: 'แสดงความคิดเห็นบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
        }
        await guardPosting(member, 'comment', typeof body.text === 'string' ? body.text : '');
        moment = await addComment(member, id, body.text);
        break;
      case 'delete_comment':
        moment = await deleteComment(member, id, String(body.commentId ?? ''));
        break;
      case 'report': {
        const result = await reportMoment(member, id, body.reason);
        moment = result.moment;
        autoHidden = result.autoHidden;
        break;
      }
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }
    return NextResponse.json({ success: true, moment: toFeedItem(moment, member, await loadPeople([moment])), ...(body.action === 'report' && { autoHidden }) });
  } catch (error) {
    if (error instanceof MomentError || error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ' }, { status: 400 });
  }
}
