import { NextResponse } from 'next/server';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { CampaignError, campaignStats, deleteCampaign, findCampaign, listCampaigns, saveCampaign } from '@/lib/campaigns/store';
import { isCampaignLive } from '@/lib/campaigns/types';
import { db } from '@/lib/db';

// Campaigns with their stats, plus the challenges and rewards a campaign can name (for the form)
export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;
  // ?lite=1: names and challenges only (the challenges list groups by campaign), no stats
  if (new URL(request.url).searchParams.get('lite') === '1') {
    return NextResponse.json({ success: true, campaigns: listCampaigns().map(({ id, name, questIds, extraQuestIds, published }) => ({ id, name, questIds, extraQuestIds, published })) });
  }
  const campaigns = await Promise.all(listCampaigns().map(async (campaign) => ({ ...campaign, live: isCampaignLive(campaign), stats: await campaignStats(campaign) })));
  const { items } = await db.findQuests({ page: 1, limit: 500, status: 'all', includeDrafts: true });
  return NextResponse.json({
    success: true,
    campaigns,
    quests: items.map((q) => ({ id: q.id, title: q.title, status: q.status, startDate: q.startDate, endDate: q.endDate, rewardPoints: q.rewardPoints ?? 0 })),
    rewards: REWARD_SHOP_ITEMS.map((r) => ({ id: r.id, title: r.title, costXp: r.costXp, drawLabel: r.drawEntry?.drawLabel })),
  });
}

// { action: 'save', campaign } (new when campaign.id is empty) · { action: 'delete', id }
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'content.edit');
  if (denied) return denied;
  const actor = getAdminActor(request);
  try {
    const body = await request.json();
    if (body?.action === 'save' && body.campaign && typeof body.campaign === 'object') {
      const isNew = !(typeof body.campaign.id === 'string' && findCampaign(body.campaign.id));
      const campaign = await saveCampaign(body.campaign);
      recordAudit(actor, isNew ? 'campaign.create' : 'campaign.update', `${isNew ? 'สร้าง' : 'แก้ไข'}แคมเปญ ${campaign.name}`, { type: 'campaign', id: campaign.id });
      return NextResponse.json({ success: true, campaign });
    }
    if (body?.action === 'delete' && typeof body.id === 'string') {
      const campaign = findCampaign(body.id);
      await deleteCampaign(body.id);
      recordAudit(actor, 'campaign.delete', `ลบแคมเปญ ${campaign?.name ?? body.id}`, { type: 'campaign', id: body.id });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof CampaignError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    console.error('Campaign save failed:', error);
    return NextResponse.json({ success: false, error: 'บันทึกแคมเปญไม่สำเร็จ' }, { status: 500 });
  }
}
