-- Trip stories (owner 2026-11-26, docs/TRIPS_PLAN.md): a trip of any size, abroad or a Sunday afternoon, told as
-- full-screen chapters by day and city. Photos come from posts made during the trip (moment_id set) or are picked from
-- the phone afterwards. Places are kept at city level only: coordinates rounded to 2 decimals (about 1 km), never the
-- exact spot a photo was taken.

create table app.trips (
  id              uuid primary key,
  author_id       uuid not null references app.members (id) on delete cascade,
  title           text not null check (char_length(title) between 2 and 80),
  intro           text not null default '' check (char_length(intro) <= 300),
  -- Days in the traveller's own calendar (the phone's time zone where the trip happened)
  starts_on       date not null,
  ends_on         date not null,
  cover_item_id   uuid,
  visibility      text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  -- draft: only the author sees it; published: shown to whoever visibility allows; hidden/removed: by staff
  status          text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'removed')),
  -- Friends who went too (member ids); each can take themselves off
  tagged_ids      uuid[] not null default '{}',
  -- Sub-trips by city (owner 2026-11-26): [{ id, city, from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }], in order, not
  -- overlapping. The author sets them; every photo belongs to the one its day falls in (lib/trips/story.ts)
  legs            jsonb not null default '[]',
  -- "ไปตามรอยทริปนี้" (owner 2026-11-26): the trip this one was planned from; its count is how many went after it
  follows_trip_id uuid references app.trips (id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on - starts_on <= 60)
);
create index trips_author_idx on app.trips (author_id, starts_on desc);
create index trips_follows_idx on app.trips (follows_trip_id) where follows_trip_id is not null;
create index trips_published_idx on app.trips (published_at desc) where status = 'published';

create table app.trip_items (
  id              uuid primary key,
  trip_id         uuid not null references app.trips (id) on delete cascade,
  -- The post it came from when it was posted during the trip; deleting the post removes it here too
  moment_id       uuid references app.moments (id) on delete cascade,
  kind            text not null default 'photo' check (kind in ('photo', 'video')),
  media_url       text not null,
  -- A clip's first frame (kind = video)
  poster_url      text,
  ratio           real,
  caption         text not null default '' check (char_length(caption) <= 300),
  -- Wall-clock time where it was taken ("2026-12-05 18:40"), which orders the story and splits it into days
  taken_local     timestamp not null,
  lat             real,
  lng             real,
  -- Filled from lat/lng through app.geo_places
  city            text,
  country         text,
  country_code    text,
  hidden          boolean not null default false,
  created_at      timestamptz not null default now(),
  check (lat is null or (lat between -90 and 90 and lng between -180 and 180))
);
create index trip_items_trip_idx on app.trip_items (trip_id, taken_local);
create index trip_items_moment_idx on app.trip_items (moment_id) where moment_id is not null;

-- City names for rounded coordinates, looked up once from OpenStreetMap (lib/trips/geo.ts) and kept
create table app.geo_places (
  key             text primary key,        -- "22.28,114.16"
  city            text,
  country         text,
  country_code    text,
  fetched_at      timestamptz not null default now()
);

alter table app.trips enable row level security;
alter table app.trips force row level security;
create policy runtime_all on app.trips to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.trips to app_runtime;

alter table app.trip_items enable row level security;
alter table app.trip_items force row level security;
create policy runtime_all on app.trip_items to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.trip_items to app_runtime;

alter table app.geo_places enable row level security;
alter table app.geo_places force row level security;
create policy runtime_all on app.geo_places to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.geo_places to app_runtime;
