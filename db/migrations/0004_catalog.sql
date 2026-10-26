-- Places, ตี้ + อีเวนต์, challenges. docs/DATABASE_DESIGN.md §4.4–4.6.
-- Every public row has a slug = today's id, so URLs do not change.
-- Category columns hold codes from app.categories (or lib/spotCategories.ts for places); the app checks
-- new writes, and retired codes stay valid on old rows.

create table app.places (
  id                 uuid primary key default app.uuid_v7(),
  slug               text not null unique,
  title              text not null check (char_length(title) >= 2),
  category           text not null,
  vibe_tags          text[] not null default '{}',
  province_code      text not null references app.provinces (code) on update cascade,
  district           text,
  description        text not null default '',
  location           extensions.geography(point, 4326),
  open_hours         text,
  price              text,
  entry_fee          text,
  best_time          text,
  transit_info       text,
  contact            jsonb not null default '{}',
  facilities         text[] not null default '{}',
  highlights         text[] not null default '{}',
  google_maps_url    text,
  rating             numeric(2, 1) check (rating between 0 and 5),
  reviews_count      int not null default 0 check (reviews_count >= 0),
  popularity         int not null default 0,
  meetup_allowed     boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published')),
  source_id          uuid references app.sources (id) on delete set null,
  source_name        text,
  source_url         text,
  curation_score     int not null default 0,
  curation_tier      text not null default 'standard' check (curation_tier in ('featured', 'standard', 'hidden')),
  curation_reasons   text[] not null default '{}',
  curation_at        timestamptz,
  curation_override  text check (curation_override in ('featured', 'standard', 'hidden')),
  curation_note      text,
  curation_by        uuid references app.staff_accounts (id) on delete set null,
  curation_override_at timestamptz,
  details            jsonb not null default '{}',  -- display-only extras
  search_text        text generated always as (title || ' ' || coalesce(district, '') || ' ' || province_code) stored,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index places_browse_idx on app.places (province_code, category) where publication_status = 'published';
create index places_curation_idx on app.places (curation_tier, popularity desc) where publication_status = 'published';
create index places_location_idx on app.places using gist (location);
create index places_search_trgm_idx on app.places using gin (search_text extensions.gin_trgm_ops);
create index places_vibes_idx on app.places using gin (vibe_tags);
create index places_source_idx on app.places (source_id);
create index places_curation_by_idx on app.places (curation_by);
create trigger places_updated before update on app.places for each row execute function app.set_updated_at();

create table app.place_images (
  place_id uuid not null references app.places (id) on delete cascade,
  position smallint not null check (position between 0 and 29),
  url      text not null,
  primary key (place_id, position)
);

create table app.event_series (
  id             uuid primary key default app.uuid_v7(),
  legacy_id      text unique,
  host_member_id uuid references app.members (id) on delete cascade,
  recurrence     jsonb not null,                   -- the rule from the create form
  created_at     timestamptz not null default now()
);
create index event_series_host_idx on app.event_series (host_member_id);

create table app.events (
  id                  uuid primary key default app.uuid_v7(),
  slug                text not null unique,
  event_type          text not null check (event_type in ('community', 'public_venue')),
  title               text not null check (char_length(title) >= 5),
  description         text not null check (char_length(description) >= 15),
  mood                text check (mood in ('heal', 'move', 'chill', 'learn')),
  category            text,                        -- community or fair category code
  tag                 text,
  province_code       text not null references app.provinces (code) on update cascade,
  zone                text,
  location_name       text not null,
  meeting_point       text,
  location            extensions.geography(point, 4326),
  place_id            uuid references app.places (id) on delete set null,
  venue_code          text references app.venues (code) on update cascade on delete set null,
  series_id           uuid references app.event_series (id) on delete set null,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  location_type       text not null default 'physical' check (location_type in ('physical', 'online')),
  online_platform     text,
  online_join_url     text,
  host_member_id      uuid references app.members (id) on delete cascade,
  organizer_name      text,                        -- shown when there is no member host
  organizer_avatar    text,
  min_participants    int check (min_participants >= 1),
  max_participants    int check (max_participants >= 1),
  participants_count  int not null default 0 check (participants_count >= 0),
  price_text          text,
  audience_tags       text[] not null default '{}',
  target_gender       text,
  target_age          text,
  energy_level        text,
  cancellation_policy text,
  registration_open   boolean not null default true,
  approval_status     text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  moderated_at        timestamptz,
  moderated_by        uuid references app.staff_accounts (id) on delete set null,
  cover_image_url     text not null default '',
  source_id           uuid references app.sources (id) on delete set null,
  source_name         text,
  source_url          text,
  external_url        text,
  details             jsonb not null default '{}', -- itinerary, rules, what to bring, gallery… (shown, never filtered)
  is_sample           boolean not null default false,
  search_text         text generated always as (title || ' ' || location_name || ' ' || province_code) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at >= starts_at),
  check (max_participants is null or participants_count <= max_participants),
  check (min_participants is null or max_participants is null or min_participants <= max_participants),
  -- ตี้: a member host and 2–15 people (seed rows exempt); อีเวนต์: an organizer and no cap
  check (event_type <> 'community' or is_sample or (host_member_id is not null and max_participants between 2 and 15)),
  check (event_type <> 'public_venue' or (organizer_name is not null and max_participants is null))
);
create index events_browse_idx on app.events (event_type, starts_at) where approval_status = 'approved';
create index events_ends_idx on app.events (event_type, ends_at) where approval_status = 'approved';
create index events_province_idx on app.events (province_code, starts_at);
create index events_host_idx on app.events (host_member_id, starts_at desc);
create index events_place_idx on app.events (place_id);
create index events_series_idx on app.events (series_id);
create index events_venue_idx on app.events (venue_code);
create index events_source_idx on app.events (source_id);
create index events_moderated_by_idx on app.events (moderated_by);
create index events_pending_idx on app.events (created_at) where approval_status = 'pending';
create index events_location_idx on app.events using gist (location);
create index events_search_trgm_idx on app.events using gin (search_text extensions.gin_trgm_ops);
create trigger events_updated before update on app.events for each row execute function app.set_updated_at();

create table app.quests (
  id                   uuid primary key default app.uuid_v7(),
  slug                 text not null unique,
  title                text not null check (char_length(title) >= 3),
  category             text,
  icon_name            text not null default '',
  objective            text not null default '',
  steps                jsonb not null default '[]',
  starts_at            timestamptz,
  ends_at              timestamptz,
  status               text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  visibility           text not null default 'public' check (visibility in ('public', 'private')),
  is_official          boolean not null default false,
  created_by_member_id uuid references app.members (id) on delete set null,
  creator_name         text,
  reward_points        int not null default 0 check (reward_points >= 0),
  rule                 jsonb,                      -- input of the rule engine (lib/social/questProgress.ts)
  brand_reward         jsonb,
  badge_label          text not null default '',
  badge_icon           text,
  cover_image_url      text,
  review_rejected_at   timestamptz,
  rejection_reason     text,
  details              jsonb not null default '{}',
  is_sample            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index quests_live_idx on app.quests (status, ends_at) where visibility = 'public';
create index quests_creator_idx on app.quests (created_by_member_id);
create trigger quests_updated before update on app.quests for each row execute function app.set_updated_at();

select app.secure_tables();
