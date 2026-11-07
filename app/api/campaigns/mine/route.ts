import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isRateLimited } from '@/lib/rateLimit';
import { claimPrize } from '@/lib/campaigns/draw';
import { CampaignError, campaignsOfMember, enrollInCampaign, leaveCampaign } from '@/lib/campaigns/store';

const headers = { 'Cache-Control': 'private, no-store' };

// The campaigns the signed-in member joined; a guest gets an empty list
export async function GET(request: Request) {
  try {
    const member = await getSessionMember(request);
    return NextResponse.json({ success: true, campaigns: member ? await campaignsOfMember(member.id) : [] }, { headers });
  } catch (error) {
    console.error('Error in /api/campaigns/mine GET:', error);
    return NextResponse.json({ success: false, message: 'โหลดแคมเปญไม่สำเร็จ' }, { status: 500 });
  }
}

// { campaignId, action?: 'leave' | 'claim' } → signs the member up and starts its step challenges, leaves, or claims a prize they won; answers with their list after the change
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (member.status !== 'active') return NextResponse.json({ success: false, message: 'บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้' }, { status: 403 });
  if (await isRateLimited(`campaign-enroll:${member.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const campaignId = typeof body.campaignId === 'string' ? body.campaignId.trim().slice(0, 60) : '';
    if (!campaignId) return NextResponse.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    if (body.action === 'claim') await claimPrize(member.id, campaignId);
    else if (body.action === 'leave') await leaveCampaign(member.id, campaignId);
    else await enrollInCampaign(member.id, campaignId);
    return NextResponse.json({ success: true, campaigns: await campaignsOfMember(member.id) }, { headers });
  } catch (error) {
    if (error instanceof CampaignError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error('Error in /api/campaigns/mine POST:', error);
    return NextResponse.json({ success: false, message: 'เข้าร่วมแคมเปญไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}
