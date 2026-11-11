import { USE_POSTGRES, sql } from '../db/postgres/client';

/**
 * "ชวนไป" step by step (owner 2026-11-12: where do friends drop off?), totals for the last `days` days, for /admin.
 * Counted from the plans and short links themselves; opens are counted since 0047 (2026-11-12).
 */
export interface InviteFunnel {
  days: number;
  /** Plans made (someone pressed ชวนไป and a plan began) */
  plans: number;
  /** Links sent out of the app (LINE, other apps), and how many of them someone opened */
  links: number;
  linksOpened: number;
  /** Friends who answered "ไปกัน", and of them the ones who signed up for it */
  yes: number;
  yesNewMembers: number;
  /** "รอบนี้ไม่สะดวก" answers */
  declines: number;
  /** Plans that got a day, that two or more people went to, and that closed after going quiet */
  dated: number;
  wentTogether: number;
  closedQuiet: number;
}

export async function inviteFunnel(days = 30): Promise<InviteFunnel | null> {
  if (!USE_POSTGRES) return null;
  const db = sql();
  const since = db`now() - make_interval(days => ${days})`;
  const [row] = await db`
    select
      (select count(*) from app.friend_plans p where p.created_at >= ${since})::int as plans,
      (select count(*) from app.invite_links l where l.created_at >= ${since})::int as links,
      (select count(*) from app.invite_links l where l.created_at >= ${since} and l.opens > 0)::int as links_opened,
      (select count(*) from app.friend_plan_members pm join app.friend_plans p on p.id = pm.plan_id
        where pm.state = 'going' and pm.member_id <> p.host_id and pm.created_at >= ${since})::int as yes,
      (select count(*) from app.friend_plan_members pm join app.friend_plans p on p.id = pm.plan_id join app.members m on m.id = pm.member_id
        where pm.state = 'going' and pm.member_id <> p.host_id and pm.created_at >= ${since} and m.created_at >= p.created_at)::int as yes_new,
      (select coalesce(sum(p.declines), 0) from app.friend_plans p where p.created_at >= ${since})::int as declines,
      (select count(*) from app.friend_plans p where p.created_at >= ${since} and p.plan_date is not null)::int as dated,
      (select count(*) from app.friend_plans p where p.created_at >= ${since}
        and (select count(*) from app.friend_plan_members x where x.plan_id = p.id and x.went_at is not null) >= 2)::int as went,
      (select count(*) from app.friend_plans p where p.closed_idle_at >= ${since})::int as closed_quiet`;
  return {
    days,
    plans: row.plans,
    links: row.links,
    linksOpened: row.links_opened,
    yes: row.yes,
    yesNewMembers: row.yes_new,
    declines: row.declines,
    dated: row.dated,
    wentTogether: row.went,
    closedQuiet: row.closed_quiet,
  };
}
