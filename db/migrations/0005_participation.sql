-- Joining, saving, Q&A, reviews, groups, challenge progress and visits. docs/DATABASE_DESIGN.md §4.2, §4.5, §4.6.

-- Joins, cancellations, waitlist and check-in in one place.
-- Join safely: in one transaction, bump events.participants_count with "where participants_count < max_participants",
-- then upsert the row here. Zero rows from the update = full or ended.
create table app.event_participants (
  event_id      uuid not null references app.events (id) on delete cascade,
  member_id     uuid not null references app.members (id) on delete cascade,
  status        text not null default 'joined' check (status in ('joined', 'cancelled', 'waitlisted', 'offered')),
  ticket_code   text not null,
  joined_at     timestamptz not null default now(),
  offered_at    timestamptz,
  cancelled_at  timestamptz,
  checked_in_at timestamptz,
  note          text,
  primary key (event_id, member_id),
  unique (event_id, ticket_code),
  check (status <> 'cancelled' or cancelled_at is not null),
  check (checked_in_at is null or status = 'joined')
);
create index event_participants_member_idx on app.event_participants (member_id, status);
create index event_participants_waitlist_idx on app.event_participants (event_id, joined_at) where status in ('waitlisted', 'offered');

create table app.saved_items (
  member_id  uuid not null references app.members (id) on delete cascade,
  place_id   uuid references app.places (id) on delete cascade,
  event_id   uuid references app.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(place_id, event_id) = 1)
);
create unique index saved_items_place_uq on app.saved_items (member_id, place_id) where place_id is not null;
create unique index saved_items_event_uq on app.saved_items (member_id, event_id) where event_id is not null;
create index saved_items_place_idx on app.saved_items (place_id);
create index saved_items_event_idx on app.saved_items (event_id);

create table app.event_questions (
  id          uuid primary key default app.uuid_v7(),
  event_id    uuid not null references app.events (id) on delete cascade,
  author_id   uuid not null references app.members (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  answer      text check (char_length(answer) <= 1000),
  answered_at timestamptz,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now(),
  check ((answer is null) = (answered_at is null))
);
create index event_questions_event_idx on app.event_questions (event_id, created_at);
create index event_questions_author_idx on app.event_questions (author_id);

create table app.event_reviews (
  id         uuid primary key default app.uuid_v7(),
  event_id   uuid not null references app.events (id) on delete cascade,
  author_id  uuid not null references app.members (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  body       text not null default '' check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  unique (event_id, author_id)
);
create index event_reviews_author_idx on app.event_reviews (author_id);

-- "Go together" groups inside an อีเวนต์
create table app.fair_groups (
  id            uuid primary key default app.uuid_v7(),
  legacy_id     text unique,
  event_id      uuid not null references app.events (id) on delete cascade,
  creator_id    uuid not null references app.members (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 80),
  meetup_point  text not null,
  meet_time     text not null,
  note          text not null default '',
  max_members   int not null check (max_members between 2 and 30),
  members_count int not null default 0 check (members_count >= 0),
  created_at    timestamptz not null default now(),
  check (members_count <= max_members)
);
create index fair_groups_event_idx on app.fair_groups (event_id);
create index fair_groups_creator_idx on app.fair_groups (creator_id);

create table app.fair_group_members (
  group_id  uuid not null references app.fair_groups (id) on delete cascade,
  member_id uuid not null references app.members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, member_id)
);
create index fair_group_members_member_idx on app.fair_group_members (member_id);

-- "อยากเจออีก": a mutual pick opens a direct chat
create table app.meet_again_picks (
  event_id   uuid not null references app.events (id) on delete cascade,
  from_id    uuid not null references app.members (id) on delete cascade,
  to_id      uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, from_id, to_id),
  check (from_id <> to_id)
);
create index meet_again_to_idx on app.meet_again_picks (to_id, from_id);
create index meet_again_from_idx on app.meet_again_picks (from_id);

-- Challenge progress (was quest_joins + quest_finishes)
create table app.quest_participants (
  quest_id    uuid not null references app.quests (id) on delete cascade,
  member_id   uuid not null references app.members (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  finished_at timestamptz,
  primary key (quest_id, member_id),
  check (finished_at is null or finished_at >= joined_at)
);
create index quest_participants_member_idx on app.quest_participants (member_id, finished_at);

create table app.quest_vouchers (
  code      text primary key,
  quest_id  uuid not null references app.quests (id) on delete cascade,
  member_id uuid not null references app.members (id) on delete cascade,
  issued_at timestamptz not null default now(),
  used_at   timestamptz,
  unique (quest_id, member_id)
);
create index quest_vouchers_member_idx on app.quest_vouchers (member_id);

select app.secure_tables();
