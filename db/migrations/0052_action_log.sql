-- The action log (docs/TRACEABILITY.md, BE-372): who did what, to what, where they came from and who gets the credit,
-- so revenue and a creator share can be worked out later. Append-only; counts use distinct members.
create table app.action_log (
  id          uuid primary key default app.uuid_v7(),
  member_id   uuid references app.members (id) on delete cascade,
  action      text not null check (action in ('join', 'save', 'challenge_join', 'visit', 'invite_yes', 'outbound', 'sponsored_click')),
  target_type text not null check (target_type in ('spot', 'community', 'fair', 'challenge', 'plan', 'link', 'slot')),
  target_ref  text not null,
  source_type text check (source_type in ('moment', 'profile', 'invite', 'share')),
  source_ref  text,
  credited_id uuid references app.members (id) on delete set null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
-- "Who brought the most people" and a creator's own numbers
create index action_log_credited_idx on app.action_log (credited_id, created_at desc) where credited_id is not null;
-- "What did this post bring"
create index action_log_source_idx on app.action_log (source_type, source_ref) where source_type is not null;
-- Carrying credit forward: the member's earlier rows for the same target
create index action_log_member_target_idx on app.action_log (member_id, target_ref, created_at desc);

alter table app.action_log enable row level security;
alter table app.action_log force row level security;
create policy runtime_all on app.action_log to app_runtime using (true) with check (true);
grant select, insert on app.action_log to app_runtime;
