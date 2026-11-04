import { randomInt, randomUUID } from 'node:crypto';
import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';
import { CLAIM_DAYS, type WinnerStatus } from './types';

/** One person drawn for a campaign's prize: app.campaign_winners, or a JSON file for a clone without a database */
export interface CampaignWinner {
  id: string;
  campaignId: string;
  /** Empty once the member deleted their account */
  memberId: string | null;
  code: string;
  status: WinnerStatus;
  /** How many entries could be drawn when this one was */
  poolSize: number;
  drawnBy: string;
  drawnAt: string;
  announcedAt?: string;
  claimBy?: string;
  claimedAt?: string;
  decidedAt?: string;
}

export interface PoolEntry {
  memberId: string;
  code: string;
}

interface WinnerStore {
  all(): Promise<CampaignWinner[]>;
  ofMember(memberId: string): Promise<CampaignWinner[]>;
  /** Draws until `count` winners stand; nobody drawn before is drawn again. Answers with the new ones, already announced when the campaign's results are out */
  draw(campaignId: string, pool: PoolEntry[], count: number, by: string): Promise<CampaignWinner[]>;
  /** Publishes the winners not yet announced and starts their time to claim; answers with those */
  announce(campaignId: string): Promise<CampaignWinner[]>;
  /** Changes a winner's status, only from one of `from`; null when it is not there or has moved on */
  move(id: string, from: WinnerStatus[], to: WinnerStatus): Promise<CampaignWinner | null>;
  removeBy(memberId: string): Promise<void>;
}

const DAY = 24 * 60 * 60 * 1000;
const newClaimBy = () => new Date(Date.now() + CLAIM_DAYS * DAY).toISOString();

/** A fair pick: every entry has the same chance, from the system's secure random numbers */
function pickAtRandom<T>(items: T[], count: number): T[] {
  const left = [...items];
  const picked: T[] = [];
  while (picked.length < count && left.length) picked.push(left.splice(randomInt(left.length), 1)[0]);
  return picked;
}

const candidates = (pool: PoolEntry[], taken: (string | null)[]) => pool.filter((entry) => !taken.includes(entry.memberId));

function jsonWinners(): WinnerStore {
  const store = createJsonStore<CampaignWinner>('campaign_winners');
  return {
    async all() {
      return store.read();
    },
    async ofMember(memberId) {
      return store.read().filter((w) => w.memberId === memberId);
    },
    async draw(campaignId, pool, count, by) {
      let drawn: CampaignWinner[] = [];
      await store.update((items) => {
        const rows = items.filter((w) => w.campaignId === campaignId);
        const open = rows.filter((w) => w.status !== 'forfeited').length;
        const announcedAt = rows.some((w) => w.announcedAt) ? new Date().toISOString() : undefined;
        drawn = pickAtRandom(candidates(pool, rows.map((w) => w.memberId)), count - open).map((entry) => ({
          id: randomUUID(),
          campaignId,
          memberId: entry.memberId,
          code: entry.code,
          status: 'pending',
          poolSize: pool.length,
          drawnBy: by,
          drawnAt: new Date().toISOString(),
          announcedAt,
          claimBy: announcedAt && newClaimBy(),
        }));
        return [...items, ...drawn];
      });
      return drawn;
    },
    async announce(campaignId) {
      const at = new Date().toISOString();
      let announced: CampaignWinner[] = [];
      await store.update((items) => {
        const next = items.map((w) => (w.campaignId === campaignId && !w.announcedAt && w.status !== 'forfeited' ? { ...w, announcedAt: at, claimBy: newClaimBy() } : w));
        announced = next.filter((w, index) => w !== items[index]);
        return next;
      });
      return announced;
    },
    async move(id, from, to) {
      const at = new Date().toISOString();
      let moved: CampaignWinner | null = null;
      await store.update((items) =>
        items.map((w) => {
          if (w.id !== id || !from.includes(w.status)) return w;
          moved = { ...w, status: to, ...(to === 'claimed' ? { claimedAt: at } : { decidedAt: at }) };
          return moved;
        })
      );
      return moved;
    },
    async removeBy(memberId) {
      const at = new Date().toISOString();
      await store.update((items) =>
        items.map((w) => (w.memberId === memberId ? { ...w, memberId: null, ...(w.status === 'pending' || w.status === 'claimed' ? { status: 'forfeited' as const, decidedAt: at } : {}) } : w))
      );
    },
  };
}

const isoOf = (value: unknown) => (value ? new Date(value as string).toISOString() : undefined);
const toWinner = (r: Record<string, unknown>): CampaignWinner => ({
  id: r.id as string,
  campaignId: r.campaign as string,
  memberId: (r.member as string | null) ?? null,
  code: r.entry_code as string,
  status: r.status as WinnerStatus,
  poolSize: r.pool_size as number,
  drawnBy: r.drawn_by as string,
  drawnAt: isoOf(r.drawn_at) as string,
  announcedAt: isoOf(r.announced_at),
  claimBy: isoOf(r.claim_by),
  claimedAt: isoOf(r.claimed_at),
  decidedAt: isoOf(r.decided_at),
});

const selectWinners = (db: Sql) => db`
  select w.id::text, c.slug as campaign, m.legacy_id as member, w.entry_code, w.status, w.pool_size, w.drawn_by, w.drawn_at, w.announced_at, w.claim_by, w.claimed_at, w.decided_at
  from app.campaign_winners w join app.campaigns c on c.id = w.campaign_id left join app.members m on m.id = w.member_id`;

function pgWinners(): WinnerStore {
  return {
    async all() {
      const db = sql();
      return (await db`${selectWinners(db)} order by w.drawn_at`).map(toWinner);
    },
    async ofMember(memberId) {
      const db = sql();
      return (await db`${selectWinners(db)} where m.legacy_id = ${memberId}`).map(toWinner);
    },
    async draw(campaignId, pool, count, by) {
      return sql().begin(async (tx) => {
        // Two staff pressing together wait here, so the second sees the first one's winners
        const [campaign] = await tx`select id from app.campaigns where slug = ${campaignId} for update`;
        const rows = (await tx`${selectWinners(tx)} where w.campaign_id = ${campaign.id}`).map(toWinner);
        const open = rows.filter((w) => w.status !== 'forfeited').length;
        const announced = rows.some((w) => w.announcedAt);
        const drawn: CampaignWinner[] = [];
        for (const entry of pickAtRandom(candidates(pool, rows.map((w) => w.memberId)), count - open)) {
          const [row] = await tx`
            insert into app.campaign_winners (campaign_id, member_id, entry_code, pool_size, drawn_by, announced_at, claim_by)
            select ${campaign.id}, m.id, ${entry.code}, ${pool.length}, ${by}, ${announced ? new Date().toISOString() : null}::timestamptz, ${announced ? newClaimBy() : null}::timestamptz
            from app.members m where m.legacy_id = ${entry.memberId}
            returning id::text`;
          if (row) drawn.push(toWinner((await tx`${selectWinners(tx)} where w.id = ${row.id}::uuid`)[0]));
        }
        return drawn;
      }) as unknown as CampaignWinner[];
    },
    async announce(campaignId) {
      const db = sql();
      const rows = await db`
        update app.campaign_winners set announced_at = now(), claim_by = ${newClaimBy()}::timestamptz
        where campaign_id = (select id from app.campaigns where slug = ${campaignId}) and announced_at is null and status <> 'forfeited'
        returning id::text`;
      if (rows.length === 0) return [];
      return (await db`${selectWinners(db)} where w.id in ${db(rows.map((r) => r.id))}`).map(toWinner);
    },
    async move(id, from, to) {
      const db = sql();
      const rows = await db`
        update app.campaign_winners
        set status = ${to}, claimed_at = case when ${to}::text = 'claimed' then now() else claimed_at end, decided_at = case when ${to}::text = 'claimed' then decided_at else now() end
        where id = ${id}::uuid and status in ${db(from)}
        returning id::text`;
      return rows.length ? toWinner((await db`${selectWinners(db)} where w.id = ${id}::uuid`)[0]) : null;
    },
    async removeBy(memberId) {
      const db = sql();
      await db`
        update app.campaign_winners
        set status = case when status in ('pending', 'claimed') then 'forfeited' else status end,
          decided_at = case when status in ('pending', 'claimed') then now() else decided_at end,
          member_id = null
        where member_id = (select id from app.members where legacy_id = ${memberId})`;
    },
  };
}

export const winnerStore: WinnerStore = USE_POSTGRES ? pgWinners() : jsonWinners();

/** Account deletion: a prize not yet taken is given up, and the winner's row keeps only the entry code */
export const removeWinnerEntriesBy = (memberId: string) => winnerStore.removeBy(memberId);
