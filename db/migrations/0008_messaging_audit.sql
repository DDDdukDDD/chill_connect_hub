-- Chat, notifications, audit log. docs/DATABASE_DESIGN.md §4.9, §4.10.

create table app.chat_rooms (
  id              uuid primary key default app.uuid_v7(),
  legacy_id       text unique,                     -- event id, grp_… or pair~a~b from chat_messages.json
  kind            text not null check (kind in ('event', 'fair_group', 'direct')),
  event_id        uuid unique references app.events (id) on delete cascade,
  fair_group_id   uuid unique references app.fair_groups (id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  check (
    (kind = 'event' and event_id is not null and fair_group_id is null) or
    (kind = 'fair_group' and fair_group_id is not null and event_id is null) or
    (kind = 'direct' and event_id is null and fair_group_id is null)
  )
);

-- Kept in sync on join/leave: "may I read this room?" and unread counts are one indexed lookup
create table app.chat_room_members (
  room_id      uuid not null references app.chat_rooms (id) on delete cascade,
  member_id    uuid not null references app.members (id) on delete cascade,
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz,
  muted        boolean not null default false,
  primary key (room_id, member_id)
);
create index chat_room_members_member_idx on app.chat_room_members (member_id);

create table app.chat_messages (
  id         uuid primary key default app.uuid_v7(),  -- time-ordered: pages by id
  room_id    uuid not null references app.chat_rooms (id) on delete cascade,
  author_id  uuid references app.members (id) on delete set null,
  body       text not null check (char_length(body) between 1 and 1000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index chat_messages_room_idx on app.chat_messages (room_id, id desc);
create index chat_messages_author_idx on app.chat_messages (author_id);

create table app.notifications (
  id           uuid primary key default app.uuid_v7(),
  recipient_id uuid not null references app.members (id) on delete cascade,
  type         text not null check (type in ('follow', 'like', 'comment', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer')),
  actor_id     uuid references app.members (id) on delete cascade,
  moment_id    uuid references app.moments (id) on delete cascade,
  event_id     uuid references app.events (id) on delete cascade,
  quest_id     uuid references app.quests (id) on delete cascade,
  preview      text check (char_length(preview) <= 200),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_recipient_idx on app.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on app.notifications (recipient_id) where read_at is null;
create index notifications_actor_idx on app.notifications (actor_id);
create index notifications_moment_idx on app.notifications (moment_id);
create index notifications_event_idx on app.notifications (event_id);
create index notifications_quest_idx on app.notifications (quest_id);

-- Append-only. Keeps ids, never personal text, so it can outlive deleted accounts.
create table app.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_kind  text not null check (actor_kind in ('staff', 'member', 'system')),
  actor_id    text,
  actor_name  text,
  actor_role  text,
  action      text not null,
  target_type text not null,
  target_id   text,
  summary     text not null default '',
  meta        jsonb not null default '{}'
);
create index audit_log_at_idx on app.audit_log (at desc);
create index audit_log_target_idx on app.audit_log (target_type, target_id, at desc);
create index audit_log_actor_idx on app.audit_log (actor_id, at desc);

select app.secure_tables();

revoke update, delete on app.audit_log from app_runtime;
