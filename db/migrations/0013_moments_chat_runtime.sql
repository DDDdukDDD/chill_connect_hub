-- What the website needs to run moments and chat from these tables instead of JSON files. Additive only.

-- The app's Moment keeps its own target type and id, including targets that no longer resolve to a row
alter table app.moments
  add column author_badge         text,
  add column target_type          text not null default 'general' check (target_type in ('spot', 'community', 'fair', 'challenge', 'general')),
  add column target_ref           text,
  add column evidence_reason      text,
  add column evidence_rejected_at timestamptz,
  add column edited_at            timestamptz;
create index moments_target_idx on app.moments (target_type, target_ref, created_at desc);

-- Comments keep the id the app gave them (cmt_…, sample-…); imported rows without one use their uuid
alter table app.moment_comments
  add column slug          text unique,
  add column author_avatar text;

create table app.moment_reports (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  reason     text not null default '',
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_reports_member_idx on app.moment_reports (member_id);

-- Fair groups still live in a JSON file, so a fair group's room has no row to point at yet
alter table app.chat_rooms drop constraint chat_rooms_check;
alter table app.chat_rooms add constraint chat_rooms_check check (
  (kind = 'event' and event_id is not null and fair_group_id is null) or
  (kind = 'fair_group' and event_id is null) or
  (kind = 'direct' and event_id is null and fair_group_id is null)
);

select app.secure_tables();
