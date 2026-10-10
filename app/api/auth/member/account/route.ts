import { NextResponse } from 'next/server';
import { memberRepository, toPublicMember } from '@/lib/members';
import { momentRepository } from '@/lib/moments';
import { clearMemberSessionCookie, getSessionMember, isSameOrigin } from '@/lib/members/session';

// PDPA: download my data
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { passwordHash: _hash, sessionVersion: _version, ...account } = member;
  void _hash;
  void _version;
  const { items: ownMoments } = await momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 10_000 });
  const moments = ownMoments.map((m) => ({ id: m.id, caption: m.caption, images: m.images, location: m.location, status: m.status, createdAt: m.createdAt, likes: m.likedBy.length, comments: m.comments.length }));
  return NextResponse.json(
    { success: true, exportedAt: new Date().toISOString(), account, profile: toPublicMember(member), moments },
    { headers: { 'Content-Disposition': `attachment; filename="chill-connect-account-${member.id}.json"`, 'Cache-Control': 'no-store' } }
  );
}

// PDPA: delete my account and everything it posted. Body { confirm: "DELETE" }
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== 'DELETE') return NextResponse.json({ success: false, message: 'กรุณายืนยันการลบบัญชี' }, { status: 400 });
  // PDPA: the member's posts, comments, likes, saves and reports go with the account
  const removedMoments = await momentRepository.removeByAuthor(member.id);
  const removedComments = await momentRepository.removeCommentsByAuthor(member.id);
  await memberRepository.remove(member.id);
  const response = NextResponse.json({ success: true, removedMoments, removedComments });
  clearMemberSessionCookie(response);
  return response;
}
