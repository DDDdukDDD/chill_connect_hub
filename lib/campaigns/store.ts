import { randomUUID } from 'node:crypto';
import { LAUNCH_CAMPAIGN } from '@/data/launchCampaign';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { db } from '../db';
import { memberRepository } from '../members';
import { createJsonStore } from '../social/jsonStore';
import { progressOf } from '../social/questProgress';
import { allQuestJoins } from '../social/questJoins';
import { redemptionCountOf } from '../social/rewardsLedger';
import { wentTogether } from '../social/friends';
import { type Campaign, type CampaignStats, bangkokToday, isCampaignLive } from './types';

/**
 * Campaigns (data/campaigns.json). An empty store starts from the launch campaign seed (data/launchCampaign.ts),
 * so a fresh clone or a serverless cold start shows it without setup.
 */
const store = createJsonStore<Campaign>('campaigns');
const DAY = 24 * 60 * 60 * 1000;

function campaigns(): Campaign[] {
  const items = store.read();
  if (items.length) return items;
  const now = new Date().toISOString();
  return [{ ...LAUNCH_CAMPAIGN, createdAt: now, updatedAt: now }];
}

export const listCampaigns = (): Campaign[] => [...campaigns()].sort((a, b) => b.startDate.localeCompare(a.startDate));

export const findCampaign = (id: string) => campaigns().find((c) => c.id === id) ?? null;

/** The campaign public pages show today: published, inside its dates, the latest start wins; `home` asks for the strip */
export function liveCampaign({ home = false } = {}): Campaign | null {
  const today = bangkokToday();
  return listCampaigns().find((c) => isCampaignLive(c, today) && (!home || c.showOnHome)) ?? null;
}

export class CampaignError extends Error {}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const ids = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim()))].slice(0, 30) : []);

/** Checks a campaign from the admin form and saves it (new when `id` is not in the store yet) */
export async function saveCampaign(input: Record<string, unknown>): Promise<Campaign> {
  const name = text(input.name, 80);
  const headline = text(input.headline, 80);
  const startDate = text(input.startDate, 10);
  const endDate = text(input.endDate, 10);
  if (name.length < 3) throw new CampaignError('ตั้งชื่อแคมเปญอย่างน้อย 3 ตัวอักษร');
  if (headline.length < 5) throw new CampaignError('พาดหัวต้องมีอย่างน้อย 5 ตัวอักษร');
  if (/รับ[^ ]*\s*(iphone|ไอโฟน)/i.test(headline) || /รับฟรี/.test(headline)) throw new CampaignError('แคมเปญจับรางวัลต้องใช้คำว่า "ลุ้น" ไม่ใช่ "รับฟรี"');
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) throw new CampaignError('ระบุวันเริ่มและวันจบ');
  if (endDate < startDate) throw new CampaignError('วันจบต้องไม่ก่อนวันเริ่ม');
  const prizeImage = text(input.prizeImage, 500);
  if (prizeImage && !/^(\/[\w\-./]+|https:\/\/\S+)$/.test(prizeImage)) throw new CampaignError('รูปรางวัลต้องเป็นลิงก์ https หรือไฟล์ใน /public');
  const rewardId = text(input.rewardId, 80);
  if (rewardId && !REWARD_SHOP_ITEMS.some((item) => item.id === rewardId)) throw new CampaignError('ไม่พบของรางวัลนี้ในแคตตาล็อก');

  const { items: quests } = await db.findQuests({ page: 1, limit: 500, status: 'all' });
  const known = new Set(quests.map((q) => q.id));
  const questIds = ids(input.questIds).filter((id) => known.has(id));
  const extraQuestIds = ids(input.extraQuestIds).filter((id) => known.has(id) && !questIds.includes(id));

  const now = new Date().toISOString();
  const id = text(input.id, 60);
  const existing = id ? findCampaign(id) : null;
  const campaign: Campaign = {
    id: existing?.id ?? `campaign-${randomUUID().slice(0, 8)}`,
    name,
    eyebrow: text(input.eyebrow, 60),
    headline,
    text: text(input.text, 240),
    stripText: text(input.stripText, 120),
    cta: text(input.cta, 30) || 'ดูวิธีร่วมสนุก',
    startDate,
    endDate,
    prizeImage: prizeImage || undefined,
    rewardId: rewardId || undefined,
    questIds,
    extraQuestIds,
    showOnHome: input.showOnHome === true,
    published: input.published === true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.update(() => [...campaigns().filter((c) => c.id !== campaign.id), campaign]);
  return campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!findCampaign(id)) throw new CampaignError('ไม่พบแคมเปญนี้');
  await store.update(() => campaigns().filter((c) => c.id !== id));
}

/** What the campaign brought in; worked out from the stores on each read */
export async function campaignStats(campaign: Campaign): Promise<CampaignStats> {
  const from = Date.parse(`${campaign.startDate}T00:00:00+07:00`);
  const to = Date.parse(`${campaign.endDate}T23:59:59+07:00`);
  const { items: members } = await memberRepository.query({ status: 'all', page: 1, limit: 100_000 });
  const joined = members.filter((m) => {
    const at = Date.parse(m.createdAt);
    return at >= from && at <= to;
  });

  let firstTeeWithin14Days = 0;
  for (const member of joined) {
    const signedUp = Date.parse(member.createdAt);
    for (const { checkedInAt } of await db.listParticipations(member.id)) {
      if (checkedInAt && Date.parse(checkedInAt) - signedUp <= 14 * DAY) {
        firstTeeWithin14Days += 1;
        break;
      }
    }
  }

  const invited = joined.filter((m) => m.invitedBy);
  let invitedActivated = 0;
  for (const member of invited) if (await wentTogether(member.id, member.invitedBy as string)) invitedActivated += 1;

  // Finished = joined and fully counted now; worked out from progress, since the finish log (quest_finishes) is
  // only written when the member opens a challenge or the rewards page
  const { items: quests } = await db.findQuests({ page: 1, limit: 500, status: 'all' });
  const campaignQuestIds = [...campaign.questIds, ...campaign.extraQuestIds];
  const joins = allQuestJoins().filter((join) => campaignQuestIds.includes(join.questId));
  const progress = new Map<string, Awaited<ReturnType<typeof progressOf>>['quests']>();
  for (const memberId of new Set(joins.map((join) => join.memberId))) progress.set(memberId, (await progressOf(memberId)).quests);
  const questRows = campaignQuestIds.flatMap((id) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest) return [];
    const joiners = joins.filter((join) => join.questId === id);
    const finished = joiners.filter((join) => progress.get(join.memberId)?.some((p) => p.questId === id && p.completed)).length;
    return [{ id, title: quest.title, joined: joiners.length, finished, isStep: campaign.questIds.includes(id) }];
  });

  return {
    signups: joined.length,
    firstTeeWithin14Days,
    invited: invited.length,
    invitedActivated,
    entries: campaign.rewardId ? redemptionCountOf(campaign.rewardId) : 0,
    quests: questRows,
  };
}
