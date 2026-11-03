-- Tag friends in a moment (owner 2026-11-03): only people who follow each other, and the tagged person can remove themselves.
create table app.moment_tags (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_tags_member_idx on app.moment_tags (member_id, created_at desc);

alter table app.moment_tags enable row level security;
alter table app.moment_tags force row level security;
create policy runtime_all on app.moment_tags to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.moment_tags to app_runtime;

alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined'));
