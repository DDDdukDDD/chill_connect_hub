import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';

/** Who signed up for which campaign: app.campaign_members, or a JSON file for a clone without a database */
export interface CampaignEntry {
  memberId: string;
  campaignId: string;
  enrolledAt: string;
}

interface CampaignMemberStore {
  ofMember(memberId: string): Promise<CampaignEntry[]>;
  add(memberId: string, campaignId: string): Promise<void>;
  remove(memberId: string, campaignId: string): Promise<void>;
  countOf(campaignId: string): Promise<number>;
  removeBy(memberId: string): Promise<void>;
}

function jsonCampaignMembers(): CampaignMemberStore {
  const store = createJsonStore<CampaignEntry>('campaign_members');
  return {
    async ofMember(memberId) {
      return store.read().filter((e) => e.memberId === memberId);
    },
    async add(memberId, campaignId) {
      await store.update((items) =>
        items.some((e) => e.memberId === memberId && e.campaignId === campaignId) ? items : [{ memberId, campaignId, enrolledAt: new Date().toISOString() }, ...items]
      );
    },
    async remove(memberId, campaignId) {
      await store.update((items) => items.filter((e) => !(e.memberId === memberId && e.campaignId === campaignId)));
    },
    async countOf(campaignId) {
      return store.read().filter((e) => e.campaignId === campaignId).length;
    },
    async removeBy(memberId) {
      await store.update((items) => items.filter((e) => e.memberId !== memberId));
    },
  };
}

function pgCampaignMembers(): CampaignMemberStore {
  return {
    async ofMember(memberId) {
      const rows = await sql()`
        select c.slug, e.enrolled_at from app.campaign_members e
        join app.campaigns c on c.id = e.campaign_id join app.members m on m.id = e.member_id
        where m.legacy_id = ${memberId}`;
      return rows.map((r) => ({ memberId, campaignId: r.slug, enrolledAt: new Date(r.enrolled_at).toISOString() }));
    },
    async add(memberId, campaignId) {
      await sql()`
        insert into app.campaign_members (campaign_id, member_id)
        select c.id, m.id from app.campaigns c, app.members m where c.slug = ${campaignId} and m.legacy_id = ${memberId}
        on conflict do nothing`;
    },
    async remove(memberId, campaignId) {
      await sql()`
        delete from app.campaign_members
        where campaign_id = (select id from app.campaigns where slug = ${campaignId}) and member_id = (select id from app.members where legacy_id = ${memberId})`;
    },
    async countOf(campaignId) {
      const [row] = await sql()`
        select count(*)::int as n from app.campaign_members e join app.campaigns c on c.id = e.campaign_id where c.slug = ${campaignId}`;
      return row.n;
    },
    async removeBy(memberId) {
      await sql()`delete from app.campaign_members where member_id = (select id from app.members where legacy_id = ${memberId})`;
    },
  };
}

export const campaignMemberStore: CampaignMemberStore = USE_POSTGRES ? pgCampaignMembers() : jsonCampaignMembers();

/** Account deletion */
export const removeCampaignEntriesBy = (memberId: string) => campaignMemberStore.removeBy(memberId);
