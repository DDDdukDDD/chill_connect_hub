-- Who shared a moment (BE-369): one row per member, so sharing again does not count twice; moments.share_count keeps
-- the number the feed shows without a count over this table on every post.
create table app.moment_shares (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_shares_member_idx on app.moment_shares (member_id);

alter table app.moments add column share_count integer not null default 0;

alter table app.moment_shares enable row level security;
alter table app.moment_shares force row level security;
create policy runtime_all on app.moment_shares to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.moment_shares to app_runtime;
