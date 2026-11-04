import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from './jsonStore';

export interface PushDevice {
  memberId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  updatedAt: string;
}

/** A member with more devices than this has old ones to forget: the oldest go first */
export const MAX_DEVICES_PER_MEMBER = 10;

interface PushStore {
  /** Adds the device, or moves it to this member if someone else signed in on it before */
  save(device: Omit<PushDevice, 'updatedAt'>): Promise<void>;
  listFor(memberIds: string[]): Promise<PushDevice[]>;
  removeEndpoints(endpoints: string[]): Promise<void>;
  removeMember(memberId: string): Promise<void>;
}

function jsonStore(): PushStore {
  const store = createJsonStore<PushDevice>('push_subscriptions');
  return {
    async save(device) {
      await store.update((items) => {
        let kept = 0;
        return [{ ...device, updatedAt: new Date().toISOString() }, ...items.filter((d) => d.endpoint !== device.endpoint)].filter((d) => d.memberId !== device.memberId || ++kept <= MAX_DEVICES_PER_MEMBER);
      });
    },
    async listFor(memberIds) {
      const wanted = new Set(memberIds);
      return store.read().filter((d) => wanted.has(d.memberId));
    },
    async removeEndpoints(endpoints) {
      const gone = new Set(endpoints);
      await store.update((items) => items.filter((d) => !gone.has(d.endpoint)));
    },
    async removeMember(memberId) {
      await store.update((items) => items.filter((d) => d.memberId !== memberId));
    },
  };
}

function postgresStore(): PushStore {
  return {
    async save(device) {
      await sql().begin(async (tx) => {
        await tx`
          insert into app.push_subscriptions (member_id, endpoint, p256dh, auth)
          select m.id, ${device.endpoint}, ${device.p256dh}, ${device.auth} from app.members m where m.legacy_id = ${device.memberId}
          on conflict (endpoint) do update set member_id = excluded.member_id, p256dh = excluded.p256dh, auth = excluded.auth, updated_at = now()`;
        await tx`
          delete from app.push_subscriptions d
          where d.member_id = (select id from app.members where legacy_id = ${device.memberId})
            and d.id not in (
              select x.id from app.push_subscriptions x where x.member_id = d.member_id order by x.updated_at desc limit ${MAX_DEVICES_PER_MEMBER}
            )`;
      });
    },
    async listFor(memberIds) {
      if (memberIds.length === 0) return [];
      const db = sql();
      const rows = await db`
        select m.legacy_id as member, d.endpoint, d.p256dh, d.auth, d.updated_at
        from app.push_subscriptions d join app.members m on m.id = d.member_id
        where m.legacy_id in ${db(memberIds)}`;
      return rows.map((r) => ({ memberId: r.member, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, updatedAt: new Date(r.updated_at).toISOString() }));
    },
    async removeEndpoints(endpoints) {
      if (endpoints.length === 0) return;
      const db = sql();
      await db`delete from app.push_subscriptions where endpoint in ${db(endpoints)}`;
    },
    async removeMember(memberId) {
      const db = sql();
      await db`delete from app.push_subscriptions where member_id = (select id from app.members where legacy_id = ${memberId})`;
    },
  };
}

export const pushStore: PushStore = USE_POSTGRES ? postgresStore() : jsonStore();
