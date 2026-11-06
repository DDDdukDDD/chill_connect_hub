import { NextResponse } from 'next/server';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { announceResults, decideWinner, drawCampaigns, drawWinners } from '@/lib/campaigns/draw';
import { CampaignError } from '@/lib/campaigns/store';

const headers = { 'Cache-Control': 'private, no-store' };

// Campaigns with a prize draw, their entries and winners. Winners' contact details are member data
export async function GET(request: Request) {
  const denied = await requireAdminApiAccess(request, 'members.manage');
  if (denied) return denied;
  return NextResponse.json({ success: true, campaigns: await drawCampaigns() }, { headers });
}

// { action: 'draw' | 'announce', campaignId } · { action: 'confirm' | 'forfeit', winnerId, campaignId }
export async function POST(request: Request) {
  const denied = await requireAdminApiAccess(request, 'members.manage') ?? await requireAdminApiAccess(request, 'content.edit');
  if (denied) return denied;
  const actor = await getAdminActor(request);
  try {
    const body = await request.json();
    const campaignId = typeof body?.campaignId === 'string' ? body.campaignId : '';
    const target = { type: 'campaign', id: campaignId };
    if (body?.action === 'draw' && campaignId) {
      const drawn = await drawWinners(campaignId, actor?.id ?? 'staff');
      // The audit entry keeps the entry codes and pool size, not who they belong to
      recordAudit(actor, 'campaign.draw', `จับรางวัล ${drawn.map((w) => w.code).join(', ')} จาก ${drawn[0].poolSize} สิทธิ์`, target);
      return NextResponse.json({ success: true, drawn: drawn.length });
    }
    if (body?.action === 'announce' && campaignId) {
      const announced = await announceResults(campaignId);
      recordAudit(actor, 'campaign.announce', `ประกาศผล ${announced.map((w) => w.code).join(', ')}`, target);
      return NextResponse.json({ success: true, announced: announced.length });
    }
    if ((body?.action === 'confirm' || body?.action === 'forfeit') && typeof body.winnerId === 'string') {
      const winner = await decideWinner(body.winnerId, body.action === 'confirm' ? 'confirmed' : 'forfeited');
      recordAudit(actor, `campaign.${body.action}`, `${body.action === 'confirm' ? 'ส่งมอบรางวัลแล้ว' : 'สละสิทธิ์'} ${winner.code}`, { type: 'campaign', id: winner.campaignId });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof CampaignError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('Campaign draw failed:', error);
    return NextResponse.json({ success: false, error: 'ทำรายการไม่สำเร็จ' }, { status: 500 });
  }
}
