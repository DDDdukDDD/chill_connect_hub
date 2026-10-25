-- Rewards shop, XP ledger, campaigns. docs/DATABASE_DESIGN.md §4.6.

create table app.rewards (
  id             uuid primary key default app.uuid_v7(),
  slug           text not null unique,             -- today's id in data/rewardsData.ts
  title          text not null,
  category       text not null check (category in ('cafe', 'boardgame', 'sports', 'merch', 'workshop')),
  category_label text not null default '',
  description    text not null default '',
  partner        text not null default '',
  partner_location text not null default '',
  icon_name      text not null default '',
  cost_xp        int not null check (cost_xp >= 0),
  stock_count    int not null default 0 check (stock_count >= 0),
  discount_value text not null default '',
  valid_until    date,
  terms          text[] not null default '{}',
  featured       boolean not null default false,
  draw_entry     jsonb,                            -- { drawLabel, prizeCount } for prize draws
  active         boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger rewards_updated before update on app.rewards for each row execute function app.set_updated_at();

-- Redeem in one transaction: lock member_stats → check balance → stock - 1 where stock > 0
-- → insert here → insert the negative xp_ledger row.
create table app.reward_redemptions (
  id           uuid primary key default app.uuid_v7(),
  reward_id    uuid not null references app.rewards (id) on delete restrict,
  member_id    uuid not null references app.members (id) on delete cascade,
  cost_xp      int not null check (cost_xp >= 0),
  voucher_code text not null unique,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index reward_redemptions_member_idx on app.reward_redemptions (member_id, created_at desc);
create index reward_redemptions_reward_idx on app.reward_redemptions (reward_id);

-- Append-only: every point earned or spent. The same source can never pay twice.
create table app.xp_ledger (
  id         bigint generated always as identity primary key,
  member_id  uuid not null references app.members (id) on delete cascade,
  delta      int not null check (delta <> 0),
  reason     text not null check (reason in ('visit', 'quest_reward', 'campaign', 'redemption', 'adjustment')),
  ref_id     uuid,                                 -- the visit, quest, campaign or redemption
  note       text,
  created_at timestamptz not null default now(),
  unique (member_id, reason, ref_id)
);
create index xp_ledger_member_idx on app.xp_ledger (member_id, created_at desc);

-- Cached totals, updated in the same transaction as the ledger
create table app.member_stats (
  member_id      uuid primary key references app.members (id) on delete cascade,
  xp_balance     int not null default 0 check (xp_balance >= 0),
  xp_earned      int not null default 0 check (xp_earned >= 0),
  events_joined  int not null default 0,
  events_hosted  int not null default 0,
  moments_count  int not null default 0,
  quests_finished int not null default 0,
  updated_at     timestamptz not null default now()
);

create table app.campaigns (
  id          uuid primary key default app.uuid_v7(),
  slug        text not null unique,
  name        text not null,
  eyebrow     text not null default '',
  headline    text not null default '',
  body        text not null default '',
  strip_text  text not null default '',
  cta         text not null default '',
  starts_on   date not null,
  ends_on     date not null,
  prize_image text,
  reward_id   uuid references app.rewards (id) on delete set null,
  show_on_home boolean not null default false,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index campaigns_live_idx on app.campaigns (starts_on, ends_on) where published;
create index campaigns_reward_idx on app.campaigns (reward_id);
create trigger campaigns_updated before update on app.campaigns for each row execute function app.set_updated_at();

create table app.campaign_quests (
  campaign_id uuid not null references app.campaigns (id) on delete cascade,
  quest_id    uuid not null references app.quests (id) on delete cascade,
  role        text not null check (role in ('step', 'extra')),
  sort_order  int not null default 0,
  primary key (campaign_id, quest_id)
);
create index campaign_quests_quest_idx on app.campaign_quests (quest_id);

select app.secure_tables();

-- History cannot be rewritten by the website
revoke update, delete on app.xp_ledger from app_runtime;
