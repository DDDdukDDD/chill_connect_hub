-- The last per-server files move to tables (owner 2026-11-02): challenge progress, rewards, ตี้ data, reports, campaigns, sponsored cards.
-- Most tables exist since 0005 to 0007. This adds what the app's own rules need.

-- A badge stays when a member leaves a finished challenge, so leaving a finished one only marks the row
alter table app.quest_participants add column left_at timestamptz;

-- One of each reward per member
create unique index reward_redemptions_once_idx on app.reward_redemptions (reward_id, member_id);

-- Staff who closed a report, as the name the console shows
alter table app.content_reports add column closed_by_label text;

-- Waiting list of a full ตี้; apart from event_participants, whose rows all count as going
create table app.event_waitlist (
  event_id   uuid not null references app.events (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  offered_at timestamptz,
  primary key (event_id, member_id)
);
create index event_waitlist_member_idx on app.event_waitlist (member_id);

create table app.sponsored_slots (
  id         text primary key,
  pillar     text not null,
  item_id    text not null,
  sponsor    text not null,
  note       text,
  starts_on  date not null,
  ends_on    date not null,
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

do $$
declare t text;
begin
  foreach t in array array['event_waitlist', 'sponsored_slots'] loop
    execute format('alter table app.%I enable row level security', t);
    execute format('alter table app.%I force row level security', t);
    execute format('create policy runtime_all on app.%I to app_runtime using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on app.%I to app_runtime', t);
  end loop;
end $$;
