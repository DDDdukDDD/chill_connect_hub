-- Reference data (was data/master_data.json) and operations tables. docs/DATABASE_DESIGN.md §4.3, §4.10.
-- Reference rows keep today's ids as their codes, so existing data and URLs need no translation.

create table app.provinces (
  code         text primary key,                 -- today's id, e.g. 'กรุงเทพฯ'
  display_name text not null,
  name_en      text not null,
  region       text not null,
  tagline      text not null default '',
  description  text not null default '',
  image_url    text,
  featured     boolean not null default false,
  active       boolean not null default true,
  sort_order   int not null default 0,
  built_in     boolean not null default false
);

create table app.zones (
  code          text primary key,
  name          text not null,
  province_code text not null references app.provinces (code) on update cascade,
  active        boolean not null default true,
  sort_order    int not null default 0,
  built_in      boolean not null default false
);
create index zones_province_idx on app.zones (province_code);

-- One table for every pillar's categories, vibes and moods
create table app.categories (
  id          bigint generated always as identity primary key,
  pillar      text not null check (pillar in ('community', 'fair', 'place', 'quest', 'mood')),
  code        text not null,
  name        text not null,
  name_en     text not null default '',
  description text not null default '',
  keywords    text[] not null default '{}',
  icon_key    text,
  color_key   text,
  image_url   text,
  parent_id   bigint references app.categories (id),
  active      boolean not null default true,
  sort_order  int not null default 0,
  built_in    boolean not null default false,
  unique (pillar, code)
);
create index categories_parent_idx on app.categories (parent_id);

create table app.venue_groups (
  code       text primary key,
  name       text not null,
  name_en    text not null default '',
  subtitle   text not null default '',
  image_url  text,
  keywords   text[] not null default '{}',
  active     boolean not null default true,
  sort_order int not null default 0,
  built_in   boolean not null default false
);

create table app.venues (
  code          text primary key,
  name          text not null,
  venue_tag     text,
  province_code text references app.provinces (code) on update cascade,
  location      text not null default '',
  transit_hint  text not null default '',
  extra         jsonb not null default '{}',     -- remaining display fields
  active        boolean not null default true,
  sort_order    int not null default 0,
  built_in      boolean not null default false
);
create index venues_province_idx on app.venues (province_code);

create table app.community_clubs (
  code       text primary key,
  name       text not null,
  name_en    text not null default '',
  subtitle   text not null default '',
  image_url  text,
  extra      jsonb not null default '{}',
  active     boolean not null default true,
  sort_order int not null default 0,
  built_in   boolean not null default false
);

-- Operations

create table app.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Scraper / import sources and their runs
create table app.sources (
  id          uuid primary key default app.uuid_v7(),
  code        text not null unique,              -- today's id
  name        text not null,
  url         text not null,
  target_type text not null check (target_type in ('event', 'place')),
  category    text,
  status      text not null default 'active' check (status in ('active', 'paused', 'error')),
  description text not null default '',
  extra       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger sources_updated before update on app.sources for each row execute function app.set_updated_at();

create table app.import_runs (
  id          uuid primary key default app.uuid_v7(),
  source_id   uuid not null references app.sources (id) on delete cascade,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null check (status in ('running', 'success', 'partial', 'failed')),
  scanned     int not null default 0,
  imported    int not null default 0,
  duplicates  int not null default 0,
  errors      int not null default 0,
  note        text
);
create index import_runs_source_idx on app.import_runs (source_id, started_at desc);

-- Works across every Vercel server, unlike the old in-memory limiter
create table app.rate_limit_hits (
  key          text not null,
  window_start timestamptz not null,
  hits         int not null default 1,
  primary key (key, window_start)
);
create index rate_limit_hits_window_idx on app.rate_limit_hits (window_start);

create table app.api_usage (
  service text not null,
  month   date not null,                         -- first day of the month
  calls   int not null default 0,
  primary key (service, month)
);

select app.secure_tables();
