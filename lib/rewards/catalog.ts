import { randomUUID } from 'node:crypto';
import { type RewardShopItem, REWARD_CATEGORIES, REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { cacheManager } from '../cache';
import { campaignDay } from '../campaigns/types';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';

/**
 * The rewards catalog (owner 2026-11-08: staff add rewards in the admin console, not in code; guaranteed rewards only since 2026-11-23, no prize draws):
 * app.rewards, or data/rewards.json for a clone without a database. An empty store reads as the seed rows in
 * data/rewardsData.ts, so a fresh clone shows the shop without setup.
 */
const CACHE_KEY = 'rewards:all';
// Read on the home page, /rewards and every redeem; another server sees a staff change within this time
const CACHE_MS = 60 * 1000;

export class RewardCatalogError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

interface CatalogStore {
  all(): Promise<RewardShopItem[]>;
  save(item: RewardShopItem, sortOrder: number): Promise<void>;
}

function jsonCatalog(): CatalogStore {
  const store = createJsonStore<RewardShopItem>('rewards');
  return {
    async all() {
      return store.read();
    },
    async save(item) {
      // The first save copies the seed rows in, so editing one does not drop the others
      await store.update((items) => {
        const base = items.length ? items : REWARD_SHOP_ITEMS;
        return base.some((r) => r.id === item.id) ? base.map((r) => (r.id === item.id ? item : r)) : [...base, item];
      });
    },
  };
}

function pgCatalog(): CatalogStore {
  return {
    async all() {
      // to_jsonb: reads before and after migration 0058 (image, emoji, campaign_only), so a deploy does not wait on it
      const rows = await sql()`select to_jsonb(w) as r from app.rewards w order by w.sort_order, w.created_at`;
      return rows.map(({ r }) => {
        return {
          id: r.slug,
          title: r.title,
          category: r.category,
          categoryLabel: r.category_label,
          costXp: r.cost_xp,
          iconName: r.icon_name || 'Gift',
          emoji: r.emoji ?? '',
          description: r.description,
          partner: r.partner,
          partnerLocation: r.partner_location,
          voucherCode: r.partner_code ?? '',
          stockCount: r.stock_count,
          discountValue: r.discount_value,
          validUntil: r.valid_until ? campaignDay(r.valid_until) : '',
          validUntilDate: r.valid_until ?? undefined,
          terms: r.terms ?? [],
          image: r.image ?? undefined,
          featured: r.featured,
          campaignOnly: r.campaign_only,
          hidden: !r.active,
        } satisfies RewardShopItem;
      });
    },
    async save(item, sortOrder) {
      const fields = {
        title: item.title,
        category: item.category,
        category_label: item.categoryLabel,
        description: item.description,
        partner: item.partner,
        partner_location: item.partnerLocation,
        icon_name: item.iconName,
        cost_xp: item.costXp,
        stock_count: item.stockCount,
        discount_value: item.discountValue,
        valid_until: item.validUntilDate ?? null,
        terms: item.terms,
        featured: Boolean(item.featured),
        draw_entry: null,
        active: !item.hidden,
        partner_code: item.voucherCode || null,
        image: item.image ?? null,
        emoji: item.emoji,
        campaign_only: Boolean(item.campaignOnly),
      };
      await sql()`
        insert into app.rewards ${sql()({ slug: item.id, sort_order: sortOrder, ...fields })}
        on conflict (slug) do update set ${sql()(fields)}`;
    },
  };
}

const store: CatalogStore = USE_POSTGRES ? pgCatalog() : jsonCatalog();

/** Every reward, hidden ones too (a member's redeemed reward must still read), in the staff's order */
export async function listRewards(): Promise<RewardShopItem[]> {
  const items = await cacheManager.getOrSet(CACHE_KEY, () => store.all(), { ttlMs: CACHE_MS, tags: [CACHE_KEY] });
  // The sample rows stand in only for a clone without a database; on Postgres an empty table means no rewards yet
  // (2026-11-24: the sample shops are switched off before launch, db/remove-sample-data.mjs)
  return items.length || USE_POSTGRES ? items : REWARD_SHOP_ITEMS;
}

export const findReward = async (id: string | undefined): Promise<RewardShopItem | null> => (id ? ((await listRewards()).find((item) => item.id === id) ?? null) : null);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const whole = (value: unknown, min: number, max: number): number | null => {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
const CATEGORIES = REWARD_CATEGORIES.filter((c) => c.id !== 'all') as readonly { id: RewardShopItem['category']; label: string }[];

/** Checks a reward from the admin form and saves it (new when `id` is not in the catalog yet) */
export async function saveReward(input: Record<string, unknown>): Promise<RewardShopItem> {
  const current = await listRewards();
  const existing = current.find((item) => item.id === text(input.id, 80)) ?? null;
  const title = text(input.title, 120);
  if (title.length < 5) throw new RewardCatalogError('ชื่อของรางวัลต้องมีอย่างน้อย 5 ตัวอักษร');
  const category = CATEGORIES.find((c) => c.id === input.category);
  if (!category) throw new RewardCatalogError('เลือกหมวดของรางวัล');
  const costXp = whole(input.costXp, 1, 100_000);
  if (costXp === null) throw new RewardCatalogError('ราคา XP ต้องเป็นจำนวนเต็ม 1 ขึ้นไป');
  const discountValue = text(input.discountValue, 80);
  if (!discountValue) throw new RewardCatalogError('ระบุว่าได้อะไร เช่น "ลด ฿50" หรือ "เครื่องดื่ม 1 แก้ว"');
  const image = text(input.image, 500);
  if (image && !/^(\/[\w\-./]+|https:\/\/\S+)$/.test(image)) throw new RewardCatalogError('รูปต้องเป็นลิงก์ https หรือไฟล์ใน /public');
  const validUntilDate = text(input.validUntilDate, 10);
  if (validUntilDate && !ISO_DATE.test(validUntilDate)) throw new RewardCatalogError('วันหมดอายุไม่ถูกต้อง');
  // Guaranteed rewards only (owner 2026-11-23): a prize draw needs a permit under the Gambling Act
  if (/ลุ้น|จับรางวัล|ชิงรางวัล|ผู้โชคดี/.test(`${title} ${text(input.description, 600)} ${discountValue}`)) throw new RewardCatalogError('ของรางวัลต้องแลกได้แน่นอน ห้ามใช้คำว่า "ลุ้น" หรือ "จับรางวัล"');
  const terms = (Array.isArray(input.terms) ? input.terms : typeof input.terms === 'string' ? input.terms.split('\n') : [])
    .map((line) => text(line, 200))
    .filter(Boolean)
    .slice(0, 12);

  const item: RewardShopItem = {
    id: existing?.id ?? `reward-${randomUUID().slice(0, 8)}`,
    title,
    category: category.id,
    categoryLabel: category.label,
    costXp,
    iconName: existing?.iconName ?? 'Gift',
    emoji: existing?.emoji ?? '',
    description: text(input.description, 600),
    partner: text(input.partner, 80) || 'Chillwaa',
    partnerLocation: text(input.partnerLocation, 120),
    voucherCode: text(input.voucherCode, 40),
    stockCount: whole(input.stockCount, 0, 1_000_000) ?? 0,
    discountValue,
    validUntil: validUntilDate ? campaignDay(validUntilDate) : '',
    validUntilDate: validUntilDate || undefined,
    terms,
    image: image || undefined,
    featured: input.featured === true,
    campaignOnly: input.campaignOnly === true,
    hidden: input.hidden === true,
  };
  if (!item.voucherCode) throw new RewardCatalogError('คูปองต้องมีรหัสของร้าน');
  const index = current.findIndex((r) => r.id === item.id);
  await store.save(item, index >= 0 ? index : current.length);
  cacheManager.invalidateTags([CACHE_KEY]);
  return item;
}
