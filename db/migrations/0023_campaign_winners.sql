-- The prize draw (owner 2026-11-04): who was drawn, whether they took the prize, and two notices about it.
-- A row stays after a winner forfeits, so nobody is drawn twice and the history can be checked. A campaign with a
-- winner cannot be deleted. A member who deletes their account loses the link; the entry code stays.

create table app.campaign_winners (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references app.campaigns (id) on delete restrict,
  member_id    uuid references app.members (id) on delete set null,
  entry_code   text not null,
  status       text not null default 'pending' check (status in ('pending', 'claimed', 'confirmed', 'forfeited')),
  pool_size    int not null,
  drawn_by     text not null,
  drawn_at     timestamptz not null default now(),
  announced_at timestamptz,
  claim_by     timestamptz,
  claimed_at   timestamptz,
  decided_at   timestamptz,
  unique (campaign_id, member_id)
);
create index campaign_winners_member_idx on app.campaign_winners (member_id);

alter table app.campaign_winners enable row level security;
alter table app.campaign_winners force row level security;
create policy runtime_all on app.campaign_winners to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.campaign_winners to app_runtime;

alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result'));
