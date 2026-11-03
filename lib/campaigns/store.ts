import { randomUUID } from 'node:crypto';
import { LAUNCH_CAMPAIGN } from '@/data/launchCampaign';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { db } from '../db';
import { memberRepository } from '../members';
import { cacheManager } from '../cache';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';
import { progressOf } from '../social/questProgress';
import { allQuestJoins } from '../social/questJoins';
import { redemptionCountOf } from '../social/rewardsLedger';
import { wentTogether } from '../social/friends';
import { type Campaign, type CampaignStats, bangkokToday, homeCampaignOf, isCampaignLive } from './types';

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

/** The campaign public pages show today: published, inside its dates, the latest start wins; `home` asks for the strip (home page and /challenges, staff turn it off together) */
export async function liveCampaign({ home = false } = {}): Promise<Campaign | null> {
  const today = bangkokToday();
  const list = await listCampaigns();
  return home ? homeCampaignOf(list, today) : (list.find((c) => isCampaignLive(c, today)) ?? null);
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
  await store.remove(id, await campaigns());
  cacheManager.invalidateTags([CACHE_KEY]);
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
    signups: joined.length,
    firstTeeWithin14Days,
    invited: invited.length,
    invitedActivated,
    entries: campaign.rewardId ? await redemptionCountOf(campaign.rewardId) : 0,
    quests: questRows,
  };
}
