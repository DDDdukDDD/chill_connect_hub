import { NextResponse } from 'next/server';
import { recordAudit } from '@/lib/auditLog';
import { memberRepository, toPublicMember } from '@/lib/members';
import { exportableAccount } from '@/lib/members/accounts';
import { momentRepository } from '@/lib/moments';
import { clearMemberSessionCookie, getSessionMember, isSameOrigin } from '@/lib/members/session';

// PDPA: download my data (account, consent record, onboarding answers, my moments)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { items: ownMoments } = await momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 10_000 });
  const moments = ownMoments.map((m) => ({ id: m.id, caption: m.caption, images: m.images, location: m.location, status: m.status, createdAt: m.createdAt, likes: m.likedBy.length, comments: m.comments.length }));
  return NextResponse.json(
    { success: true, exportedAt: new Date().toISOString(), account: exportableAccount(member, { forMember: true }), profile: toPublicMember(member), moments },
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
  // Keep proof that the deletion happened, without keeping who it was
  recordAudit(null, 'member.self_delete', `สมาชิกลบบัญชีของตัวเอง (โมเมนต์ ${removedMoments} คอมเมนต์ ${removedComments})`, { type: 'member', id: member.id });
  const response = NextResponse.json({ success: true, removedMoments, removedComments });
  clearMemberSessionCookie(response);
  return response;
}
