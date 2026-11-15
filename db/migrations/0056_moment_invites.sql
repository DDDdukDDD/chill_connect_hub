-- Who sent "ชวนไป" from a moment (BE-384): one row per member, like moment_shares (0050), so asking again does not
-- count twice; moments.invite_count keeps the number the post shows without a count over this table.
create table app.moment_invites (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_invites_member_idx on app.moment_invites (member_id);

alter table app.moments add column invite_count integer not null default 0;

alter table app.moment_invites enable row level security;
alter table app.moment_invites force row level security;
create policy runtime_all on app.moment_invites to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.moment_invites to app_runtime;
