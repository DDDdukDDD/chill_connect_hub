-- Moments, stories, visits and reports. docs/DATABASE_DESIGN.md §4.6–4.8.

create table app.moments (
  id                  uuid primary key default app.uuid_v7(),
  slug                text not null unique,        -- today's id, used in /moments/<slug>
  author_id           uuid references app.members (id) on delete cascade,  -- null = sample
  author_name         text,                        -- samples only; members' names come from app.members
  author_avatar       text,
  caption             text not null default '' check (char_length(caption) <= 500),
  location_text       text not null default '',
  category            text check (category in ('heal', 'move', 'chill', 'learn')),
  place_id            uuid references app.places (id) on delete set null,
  event_id            uuid references app.events (id) on delete set null,
  quest_id            uuid references app.quests (id) on delete set null,
  target_title        text,                        -- title when the moment was posted
  status              text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  hidden_by           text check (hidden_by in ('reports', 'admin')),
  moderation_note     text,
  evidence_status     text check (evidence_status in ('auto', 'pending', 'approved', 'rejected')),
  evidence_at         timestamptz,
  evidence_distance_m int,
  evidence_note       text,
  image_ratio         real,
  like_count          int not null default 0 check (like_count >= 0),
  comment_count       int not null default 0 check (comment_count >= 0),
  save_count          int not null default 0 check (save_count >= 0),
  sample_likes        int not null default 0,
  is_sample           boolean not null default false,
  search_text         text generated always as (caption || ' ' || location_text) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (num_nonnulls(place_id, event_id, quest_id) <= 1),
  check (author_id is not null or is_sample)
);
create index moments_feed_idx on app.moments (status, created_at desc);
create index moments_popular_idx on app.moments (status, like_count desc, created_at desc);
create index moments_author_idx on app.moments (author_id, created_at desc);
create index moments_place_idx on app.moments (place_id, created_at desc);
create index moments_event_idx on app.moments (event_id, created_at desc);
create index moments_quest_idx on app.moments (quest_id, created_at desc);
create index moments_evidence_queue_idx on app.moments (created_at) where evidence_status = 'pending';
create index moments_search_trgm_idx on app.moments using gin (search_text extensions.gin_trgm_ops);
create trigger moments_updated before update on app.moments for each row execute function app.set_updated_at();

create table app.moment_images (
  moment_id uuid not null references app.moments (id) on delete cascade,
  position  smallint not null check (position between 0 and 9),   -- at most 10 photos
  url       text not null,
  primary key (moment_id, position)
);

create table app.moment_likes (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_likes_member_idx on app.moment_likes (member_id, created_at desc);

create table app.moment_saves (
  moment_id  uuid not null references app.moments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, member_id)
);
create index moment_saves_member_idx on app.moment_saves (member_id, created_at desc);

create table app.moment_comments (
  id          uuid primary key default app.uuid_v7(),
  moment_id   uuid not null references app.moments (id) on delete cascade,
  author_id   uuid references app.members (id) on delete cascade,
  author_name text,                                -- samples only
  body        text not null check (char_length(body) between 1 and 300),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index moment_comments_moment_idx on app.moment_comments (moment_id, created_at);
create index moment_comments_author_idx on app.moment_comments (author_id);

create table app.stories (
  id         uuid primary key default app.uuid_v7(),
  author_id  uuid not null references app.members (id) on delete cascade,
  image_url  text not null,
  caption    text not null default '' check (char_length(caption) <= 200),
  expires_at timestamptz not null,
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index stories_author_idx on app.stories (author_id, created_at desc);
create index stories_live_idx on app.stories (expires_at) where not hidden;

create table app.story_views (
  story_id  uuid not null references app.stories (id) on delete cascade,
  viewer_id uuid not null references app.members (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
create index story_views_viewer_idx on app.story_views (viewer_id);

-- Every "I was there", with how strong the evidence is
create table app.visits (
  id          uuid primary key default app.uuid_v7(),
  member_id   uuid not null references app.members (id) on delete cascade,
  place_id    uuid references app.places (id) on delete cascade,
  event_id    uuid references app.events (id) on delete cascade,
  evidence    text not null check (evidence in ('marked', 'moment', 'checkin')),
  moment_id   uuid references app.moments (id) on delete cascade,
  pending     boolean not null default false,
  rating      smallint check (rating between 1 and 5),
  review      text check (char_length(review) <= 1000),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  check (num_nonnulls(place_id, event_id) = 1),
  check (evidence <> 'moment' or moment_id is not null)
);
create unique index visits_place_uq on app.visits (member_id, place_id, evidence) where place_id is not null;
create unique index visits_event_uq on app.visits (member_id, event_id, evidence) where event_id is not null;
create index visits_member_idx on app.visits (member_id, created_at desc);
create index visits_place_idx on app.visits (place_id, created_at desc);
create index visits_event_idx on app.visits (event_id);
create index visits_moment_idx on app.visits (moment_id);

-- One table for every report: moments, comments, stories, members, ตี้, อีเวนต์, places, chat
create table app.content_reports (
  id          uuid primary key default app.uuid_v7(),
  target_type text not null check (target_type in ('moment', 'comment', 'story', 'member', 'community', 'fair', 'spot', 'review', 'chat_message', 'question')),
  target_id   text not null,                       -- kept as text: a report must outlive what it points at
  target_title text,
  host_member_id uuid references app.members (id) on delete set null,
  room_id     text,
  reporter_id uuid references app.members (id) on delete set null,
  reason      text not null,
  details     text not null default '' check (char_length(details) <= 1000),
  excerpt     text,
  status      text not null default 'open' check (status in ('open', 'closed')),
  closed_by   uuid references app.staff_accounts (id) on delete set null,
  closed_at   timestamptz,
  note        text,
  created_at  timestamptz not null default now(),
  check (status = 'open' or closed_at is not null)
);
create unique index content_reports_once_uq on app.content_reports (target_type, target_id, reporter_id);
create index content_reports_open_idx on app.content_reports (created_at) where status = 'open';
create index content_reports_target_idx on app.content_reports (target_type, target_id);
create index content_reports_reporter_idx on app.content_reports (reporter_id);
create index content_reports_host_idx on app.content_reports (host_member_id);
create index content_reports_closed_by_idx on app.content_reports (closed_by);

select app.secure_tables();
