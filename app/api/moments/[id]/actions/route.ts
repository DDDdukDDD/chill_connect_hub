import { NextResponse } from 'next/server';
import { addComment, setCommentLike, deleteComment, loadPeople, MomentError, removeMyTag, reportMoment, setLike, setSaved, toFeedItem } from '@/lib/moments/service';
import { MemberAuthError } from '@/lib/members/accounts';
import { guardPosting } from '@/lib/members/safety';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { notify, removeNotifications } from '@/lib/social/notifications';

/**
 * Member actions on a moment:
 * { action: 'like' | 'unlike' | 'save' | 'unsave' }
 * { action: 'comment', text, parentId? } · { action: 'delete_comment', commentId } (the commenter or the post's author; its replies go with it)
 * { action: 'like_comment' | 'unlike_comment', commentId }
 * { action: 'report', reason } · { action: 'untag' } (the member takes themselves off the post)
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
        if (body.action === 'like') await notify(moment.authorId, member, 'like', moment.id);
        else if (moment.authorId) await removeNotifications({ memberId: moment.authorId, actorId: member.id, types: ['like'], momentId: moment.id });
        break;
      case 'save':
      case 'unsave':
        moment = await setSaved(member, id, body.action === 'save');
        break;
      case 'comment':
        if (await isRateLimited(`moment-comment:${member.id}`, 30, 10 * 60 * 1000)) {
          return NextResponse.json({ success: false, message: 'แสดงความคิดเห็นบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
        }
        await guardPosting(member, 'comment', typeof body.text === 'string' ? body.text : '');
        moment = await addComment(member, id, body.text, body.parentId);
        {
          const said = typeof body.text === 'string' ? body.text.trim() : undefined;
          const newId = moment.comments[moment.comments.length - 1]?.id;
          const answeredAuthor = moment.comments.find((c) => c.id === body.parentId)?.authorId;
          await notify(answeredAuthor, member, 'reply', moment.id, said, newId);
          // The author of the post hears once, also when the reply is to them
          if (moment.authorId !== answeredAuthor) await notify(moment.authorId, member, 'comment', moment.id, said, newId);
        }
        break;
      case 'like_comment':
      case 'unlike_comment': {
        const commentId = String(body.commentId ?? '');
        moment = await setCommentLike(member, id, commentId, body.action === 'like_comment');
        const liked = moment.comments.find((c) => c.id === commentId);
        if (body.action === 'like_comment') await notify(liked?.authorId, member, 'comment_like', moment.id, liked?.text, commentId);
        else if (liked?.authorId) await removeNotifications({ memberId: liked.authorId, actorId: member.id, types: ['comment_like'], commentId });
        break;
      }
      case 'delete_comment':
        {
          const removed = await deleteComment(member, id, String(body.commentId ?? ''));
          moment = removed.moment;
          const momentId = moment.id;
          await Promise.all(removed.removedIds.map((commentId) => removeNotifications({ types: ['comment', 'reply', 'comment_like'], momentId, commentId })));
        }
        break;
      case 'untag':
        moment = await removeMyTag(member, id);
        await removeNotifications({ memberId: member.id, types: ['tagged'], momentId: moment.id });
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
