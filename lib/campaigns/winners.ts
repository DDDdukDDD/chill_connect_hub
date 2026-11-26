import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';

/**
 * Rows left from the prize draws (app.campaign_winners, or a JSON file for a clone without a database). Draws were
 * removed on 2026-11-26 (owner 2026-11-23: guaranteed rewards only), so nothing adds rows any more; a member's rows
 * still go out with their data export and are cleared when they delete their account.
 */
export interface CampaignWinner {
  id: string;
  campaignId: string;
  /** Empty once the member deleted their account */
  memberId: string | null;
  code: string;
  status: string;
  drawnAt: string;
  announcedAt?: string;
  claimedAt?: string;
  decidedAt?: string;
}

interface WinnerStore {
  ofMember(memberId: string): Promise<CampaignWinner[]>;
  removeBy(memberId: string): Promise<void>;
}

function jsonWinners(): WinnerStore {
  const store = createJsonStore<CampaignWinner>('campaign_winners');
  return {
    async ofMember(memberId) {
      return store.read().filter((w) => w.memberId === memberId);
    },
    async removeBy(memberId) {
      const at = new Date().toISOString();
      await store.update((items) =>
        items.map((w) => (w.memberId === memberId ? { ...w, memberId: null, ...(w.status === 'pending' || w.status === 'claimed' ? { status: 'forfeited', decidedAt: at } : {}) } : w))
      );
    },
  };
}

const isoOf = (value: unknown) => (value ? new Date(value as string).toISOString() : undefined);

function pgWinners(): WinnerStore {
  return {
    async ofMember(memberId) {
      const rows = await sql()`
        select w.id::text, c.slug as campaign, m.legacy_id as member, w.entry_code, w.status, w.drawn_at, w.announced_at, w.claimed_at, w.decided_at
        from app.campaign_winners w join app.campaigns c on c.id = w.campaign_id join app.members m on m.id = w.member_id
        where m.legacy_id = ${memberId}`;
      return rows.map((r) => ({
        id: r.id as string,
        campaignId: r.campaign as string,
        memberId: (r.member as string | null) ?? null,
        code: r.entry_code as string,
        status: r.status as string,
        drawnAt: isoOf(r.drawn_at) as string,
        announcedAt: isoOf(r.announced_at),
        claimedAt: isoOf(r.claimed_at),
        decidedAt: isoOf(r.decided_at),
      }));
    },
    async removeBy(memberId) {
      await sql()`
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
