import { NextResponse } from 'next/server';
import { marksOf } from '@/lib/social/visits';
import { joinsOf } from '@/lib/social/questJoins';
import { campaignMemberStore } from '@/lib/campaigns/members';
import { winnerStore } from '@/lib/campaigns/winners';
import { vouchersOf } from '@/lib/social/questVouchers';
import { memberRepository, toPublicMember } from '@/lib/members';
import { exportableAccount } from '@/lib/members/accounts';
import { deleteMemberAccount } from '@/lib/members/deleteAccount';
import { momentRepository } from '@/lib/moments';
import { clearMemberSessionCookie, getSessionMember, isSameOrigin, refreshMemberStatus, setMemberSessionCookie } from '@/lib/members/session';

// PDPA: download my data (account, consent record, onboarding answers, my moments)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const { items: ownMoments } = await momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 10_000 });
  const moments = ownMoments.map((m) => ({ id: m.id, caption: m.caption, images: m.images, location: m.location, status: m.status, createdAt: m.createdAt, likes: m.likedBy.length, comments: m.comments.length }));
  return NextResponse.json(
    { success: true, exportedAt: new Date().toISOString(), account: exportableAccount(member, { forMember: true }), profile: toPublicMember(member), moments, visits: await marksOf(member.id), joinedChallenges: await joinsOf(member.id), joinedCampaigns: (await campaignMemberStore.ofMember(member.id)).map(({ campaignId, enrolledAt }) => ({ campaignId, enrolledAt })), prizeDraws: (await winnerStore.ofMember(member.id)).map(({ campaignId, code, status, announcedAt, claimedAt }) => ({ campaignId, code, status, announcedAt, claimedAt })), challengeRewardCodes: await vouchersOf(member.id) },
    { headers: { 'Content-Disposition': `attachment; filename="chill-connect-account-${member.id}.json"`, 'Cache-Control': 'no-store' } }
  );
}

// PDPA: delete my account and everything it posted. Body { confirm: "DELETE" }. An owner's sub-accounts go with it;
// deleting a sub-account switches the browser back to its owner (BE-393)
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== 'DELETE') return NextResponse.json({ success: false, message: 'กรุณายืนยันการลบบัญชี' }, { status: 400 });
  const owner = member.ownerId ? await memberRepository.findFresh(member.ownerId) : null;
  const { removedMoments, removedComments } = await deleteMemberAccount(member);
  const backTo = owner ? await refreshMemberStatus(owner) : null;
  const signedInAs = backTo?.status === 'active' ? backTo : null;
  const response = NextResponse.json({ success: true, removedMoments, removedComments, member: signedInAs ? toPublicMember(signedInAs) : null });
  if (signedInAs) setMemberSessionCookie(response, signedInAs);
  else clearMemberSessionCookie(response);
  return response;
}
