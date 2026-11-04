import { randomUUID } from 'node:crypto';
import { LAUNCH_CAMPAIGN } from '@/data/launchCampaign';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { db } from '../db';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { hasConfirmedIdentity } from '../members/trust';
import { cacheManager } from '../cache';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';
import { progressOf } from '../social/questProgress';
import { allQuestJoins } from '../social/questJoins';
import { redemptionCountOf } from '../social/rewardsLedger';
import { wentTogether } from '../social/friends';
import { QuestJoinError, joinQuest } from '../social/questJoins';
import { redemptionStore } from '../social/stores';
import { campaignMemberStore } from './members';
import { type Campaign, type CampaignStats, type CampaignView, type MyCampaign, RESULTS_SHOWN_DAYS, bangkokToday, homeCampaignsOf, isCampaignLive } from './types';
import { winnerStore } from './winners';

/**
 * Campaigns: app.campaigns, or data/campaigns.json for a clone without a database. An empty store starts from the
 * launch campaign seed (data/launchCampaign.ts), so a fresh clone shows it without setup.
 */
const DAY = 24 * 60 * 60 * 1000;
const CACHE_KEY = 'campaigns:all';
// Read on the home page and /challenges; another server sees a staff change within this time
const CACHE_MS = 60 * 1000;

interface CampaignStore {
  all(): Promise<Campaign[]>;
  save(campaign: Campaign, current: Campaign[]): Promise<void>;
  remove(id: string, current: Campaign[]): Promise<void>;
}

function jsonCampaigns(): CampaignStore {
  const store = createJsonStore<Campaign>('campaigns');
  return {
    async all() {
      return store.read();
    },
    async save(campaign, current) {
      await store.update(() => [...current.filter((c) => c.id !== campaign.id), campaign]);
    },
    async remove(id, current) {
      await store.update(() => current.filter((c) => c.id !== id));
    },
  };
}

function pgCampaigns(): CampaignStore {
  return {
    async all() {
      const rows = await sql()`
        select c.slug, c.name, c.eyebrow, c.headline, c.body, c.strip_text, c.cta, c.starts_on::text, c.ends_on::text, c.prize_image, c.show_on_home, c.published, c.created_at, c.updated_at,
          w.slug as reward,
          array(select q.slug from app.campaign_quests cq join app.quests q on q.id = cq.quest_id where cq.campaign_id = c.id and cq.role = 'step' order by cq.sort_order) as steps,
          array(select q.slug from app.campaign_quests cq join app.quests q on q.id = cq.quest_id where cq.campaign_id = c.id and cq.role = 'extra' order by cq.sort_order) as extras
        from app.campaigns c left join app.rewards w on w.id = c.reward_id`;
      return rows.map((r) => ({
        id: r.slug,
        name: r.name,
        eyebrow: r.eyebrow,
        headline: r.headline,
        text: r.body,
        stripText: r.strip_text,
        cta: r.cta,
        startDate: r.starts_on,
        endDate: r.ends_on,
        prizeImage: r.prize_image ?? undefined,
        rewardId: r.reward ?? undefined,
        questIds: r.steps,
        extraQuestIds: r.extras,
        showOnHome: r.show_on_home,
        published: r.published,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      }));
    },
    async save(c) {
      await sql().begin(async (tx) => {
        const fields = { name: c.name, eyebrow: c.eyebrow, headline: c.headline, body: c.text, strip_text: c.stripText, cta: c.cta, starts_on: c.startDate, ends_on: c.endDate, prize_image: c.prizeImage ?? null, show_on_home: c.showOnHome, published: c.published };
        const [row] = await tx`
          insert into app.campaigns ${tx({ slug: c.id, ...fields })}
          on conflict (slug) do update set ${tx(fields)}
          returning id`;
        await tx`update app.campaigns set reward_id = (select id from app.rewards where slug = ${c.rewardId ?? null}) where id = ${row.id}`;
        await tx`delete from app.campaign_quests where campaign_id = ${row.id}`;
        for (const [role, slugs] of [['step', c.questIds], ['extra', c.extraQuestIds]] as const) {
          for (const [position, slug] of slugs.entries()) {
            await tx`insert into app.campaign_quests (campaign_id, quest_id, role, sort_order) select ${row.id}, q.id, ${role}, ${position} from app.quests q where q.slug = ${slug} on conflict do nothing`;
          }
        }
      });
    },
    async remove(id) {
      await sql()`delete from app.campaigns where slug = ${id}`;
    },
  };
}

const store: CampaignStore = USE_POSTGRES ? pgCampaigns() : jsonCampaigns();

async function campaigns(): Promise<Campaign[]> {
  const items = await cacheManager.getOrSet(CACHE_KEY, () => store.all(), { ttlMs: CACHE_MS, tags: [CACHE_KEY] });
  if (items.length) return items;
  const now = new Date().toISOString();
  return [{ ...LAUNCH_CAMPAIGN, createdAt: now, updatedAt: now }];
}

export const listCampaigns = async (): Promise<Campaign[]> => [...(await campaigns())].sort((a, b) => b.startDate.localeCompare(a.startDate));

export const findCampaign = async (id: string) => (await campaigns()).find((c) => c.id === id) ?? null;

/** Every campaign with the challenges behind its steps; read on the home page, so kept as long as the list */
const campaignViews = (): Promise<CampaignView[]> =>
  cacheManager.getOrSet(
    `${CACHE_KEY}:views`,
    async () => {
      const { items: quests } = await db.findQuests({ page: 1, limit: 500, status: 'all' });
      return (await listCampaigns()).map((campaign) => ({
        ...campaign,
        steps: campaign.questIds.flatMap((id) => {
          const quest = quests.find((q) => q.id === id);
          return quest ? [{ id, title: quest.title, image: quest.badgeCoverImg, total: Number(quest.total) || 1, rewardPoints: quest.rewardPoints ?? 0 }] : [];
        }),
      }));
    },
    { ttlMs: CACHE_MS, tags: [CACHE_KEY] }
  );

/** The campaigns the home page and /challenges show today (staff turn the strip off for both together) */
export const homeCampaigns = async (): Promise<CampaignView[]> => homeCampaignsOf(await campaignViews());

export class CampaignError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * The campaigns My Hub lists: joined ones while they run, and after the end only for a member holding a draw entry,
 * until the results have been out for a while (owner 2026-11-04). A winner keeps theirs until the prize is settled.
 * Redeeming the prize counts as joining: the shop has no sign-up step.
 */
export async function campaignsOfMember(memberId: string): Promise<MyCampaign[]> {
  const today = bangkokToday();
  const entries = await campaignMemberStore.ofMember(memberId);
  const redemptions = await redemptionStore.ofMember(memberId);
  const announced = (await winnerStore.all()).filter((w) => w.announcedAt);
  return (await campaignViews())
    .flatMap((campaign): MyCampaign[] => {
      const redeemedAt = redemptions.find((r) => r.rewardId === campaign.rewardId)?.createdAt;
      const enrolledAt = entries.find((e) => e.campaignId === campaign.id)?.enrolledAt ?? redeemedAt;
      if (!enrolledAt || !campaign.published) return [];
      const rows = announced.filter((w) => w.campaignId === campaign.id);
      const mine = rows.find((w) => w.memberId === memberId);
      const firstOut = rows.map((w) => Date.parse(w.announcedAt as string)).sort((a, b) => a - b)[0];
      const isDraw = Boolean(REWARD_SHOP_ITEMS.find((item) => item.id === campaign.rewardId)?.drawEntry);
      const stillShown = firstOut === undefined || Date.now() - firstOut < RESULTS_SHOWN_DAYS * DAY;
      const shown = isCampaignLive(campaign, today) || (redeemedAt && isDraw && stillShown) || mine?.status === 'pending' || mine?.status === 'claimed';
      if (!shown) return [];
      return [{ campaign, enrolledAt, resultsOut: firstOut !== undefined, win: mine && { status: mine.status, code: mine.code, claimBy: mine.claimBy, expired: mine.status === 'pending' && Boolean(mine.claimBy) && Date.parse(mine.claimBy as string) < Date.now() } }];
    })
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

/** Signs up for a running campaign and starts its step challenges, so the progress counts at once; a second time changes nothing */
export async function enrollInCampaign(memberId: string, campaignId: string): Promise<void> {
  const campaign = (await campaignViews()).find((c) => c.id === campaignId);
  if (!campaign || !campaign.published) throw new CampaignError('ไม่พบแคมเปญนี้', 404);
  if (!isCampaignLive(campaign)) throw new CampaignError('แคมเปญนี้ไม่ได้เปิดรับอยู่ตอนนี้', 409);
  await campaignMemberStore.add(memberId, campaign.id);
  for (const step of campaign.steps) {
    try {
      await joinQuest(memberId, step.id);
    } catch (error) {
      // A step that has ended stays out; the member is still in the campaign
      if (!(error instanceof QuestJoinError)) throw error;
    }
  }
}

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
  const existing = id ? await findCampaign(id) : null;
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
  await store.save(campaign, await campaigns());
  cacheManager.invalidateTags([CACHE_KEY]);
  return campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!(await findCampaign(id))) throw new CampaignError('ไม่พบแคมเปญนี้');
  if ((await winnerStore.all()).some((w) => w.campaignId === id)) throw new CampaignError('แคมเปญนี้จับรางวัลแล้ว เก็บไว้เป็นหลักฐาน ลบไม่ได้ ซ่อนแถบแทนได้');
  await store.remove(id, await campaigns());
  cacheManager.invalidateTags([CACHE_KEY]);
}

/** Leaves a campaign to swap to another. The challenges stay: they count on their own. An entry already redeemed cannot be undone */
export async function leaveCampaign(memberId: string, campaignId: string): Promise<void> {
  const campaign = await findCampaign(campaignId);
  if (!campaign) throw new CampaignError('ไม่พบแคมเปญนี้', 404);
  if ((await redemptionStore.ofMember(memberId)).some((r) => r.rewardId === campaign.rewardId)) throw new CampaignError('คุณแลกสิทธิ์ลุ้นแคมเปญนี้แล้ว จึงออกไม่ได้', 409);
  await campaignMemberStore.remove(memberId, campaignId);
}

/** Why this member cannot redeem this reward now, or null. A draw needs a real person, and a campaign's prize closes with the campaign */
export async function redeemRefusal(member: Member, rewardId: string): Promise<{ message: string; status: number } | null> {
  const reward = REWARD_SHOP_ITEMS.find((item) => item.id === rewardId);
  if (!reward) return null;
  const owners = (await campaigns()).filter((c) => c.rewardId === rewardId && c.published);
  if (owners.length === 0) return reward.campaignOnly ? { message: 'ไม่พบของรางวัลนี้', status: 404 } : null;
  if (!owners.some((c) => isCampaignLive(c))) return { message: 'แคมเปญนี้ปิดแลกสิทธิ์แล้ว', status: 409 };
  if (!reward.drawEntry) return null;
  if (!hasConfirmedIdentity(member)) return { message: 'ยืนยันตัวตนก่อนนะ แล้วค่อยแลกสิทธิ์ลุ้น', status: 403 };
  // XP alone is not going out: marking places earns it with nothing checked (E2E 2026-11-04)
  const { quests } = await progressOf(member.id);
  const done = owners.some((c) => isCampaignLive(c) && c.questIds.every((id) => quests.some((q) => q.questId === id && q.completed && q.joined)));
  return done ? null : { message: 'ทำชาเลนจ์ในแคมเปญให้ครบก่อน แล้วค่อยแลกสิทธิ์ลุ้นนะ', status: 409 };
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
  const joins = (await allQuestJoins()).filter((join) => campaignQuestIds.includes(join.questId));
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
    enrolled: await campaignMemberStore.countOf(campaign.id),
    signups: joined.length,
    firstTeeWithin14Days,
    invited: invited.length,
    invitedActivated,
    entries: campaign.rewardId ? await redemptionCountOf(campaign.rewardId) : 0,
    quests: questRows,
  };
}
