-- Members sign up for a campaign from its popup (owner 2026-11-04); My Hub lists the ones they joined.

create table app.campaign_members (
  campaign_id uuid not null references app.campaigns (id) on delete cascade,
  member_id   uuid not null references app.members (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (campaign_id, member_id)
);
create index campaign_members_member_idx on app.campaign_members (member_id);

alter table app.campaign_members enable row level security;
alter table app.campaign_members force row level security;
create policy runtime_all on app.campaign_members to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.campaign_members to app_runtime;
