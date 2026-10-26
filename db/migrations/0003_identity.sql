-- Identity & access, social graph. docs/DATABASE_DESIGN.md §4.1, §4.2.

create table app.staff_accounts (
  id              uuid primary key default app.uuid_v7(),
  legacy_id       text unique,
  email           extensions.citext not null unique,
  name            text not null,
  role            text not null check (role in ('owner', 'editor', 'moderator', 'data_ops')),
  status          text not null default 'active' check (status in ('active', 'disabled')),
  password_hash   text not null,
  session_version int not null default 1,
  created_by      uuid references app.staff_accounts (id) on delete set null,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index staff_created_by_idx on app.staff_accounts (created_by);
create trigger staff_updated before update on app.staff_accounts for each row execute function app.set_updated_at();

create table app.members (
  id                uuid primary key default app.uuid_v7(),
  legacy_id         text unique,                 -- id from members.json, kept for the move
  display_name      text not null check (char_length(display_name) between 1 and 60),
  email             extensions.citext unique,
  email_verified_at timestamptz,
  avatar_url        text,
  status            text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  suspended_until   timestamptz,
  status_reason     text,
  session_version   int not null default 1,
  invite_code       text not null unique,
  invited_by        uuid references app.members (id) on delete set null,
  signup_ip_hash    text,
  onboarded_at      timestamptz,
  last_login_at     timestamptz,
  last_login_method text check (last_login_method in ('email', 'google', 'facebook', 'apple')),
  is_sample         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (status <> 'suspended' or suspended_until is not null)
);
create index members_invited_by_idx on app.members (invited_by);
create index members_status_idx on app.members (status, created_at desc);
create index members_name_trgm_idx on app.members using gin (display_name extensions.gin_trgm_ops);
create index members_signup_ip_idx on app.members (signup_ip_hash) where signup_ip_hash is not null;
create trigger members_updated before update on app.members for each row execute function app.set_updated_at();

-- Apart from members so a careless "select *" never returns a hash
create table app.member_credentials (
  member_id           uuid primary key references app.members (id) on delete cascade,
  password_hash       text not null,
  password_changed_at timestamptz not null default now()
);

create table app.member_auth_providers (
  provider  text not null check (provider in ('google', 'facebook', 'apple')),
  subject   text not null,
  member_id uuid not null references app.members (id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (provider, subject),
  unique (member_id, provider)
);

create table app.member_tokens (
  id         uuid primary key default app.uuid_v7(),
  member_id  uuid not null references app.members (id) on delete cascade,
  purpose    text not null check (purpose in ('verify_email', 'reset_password')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index member_tokens_member_idx on app.member_tokens (member_id, purpose);

create table app.member_profiles (
  member_id           uuid primary key references app.members (id) on delete cascade,
  bio                 text check (char_length(bio) <= 500),
  occupation          text,
  workplace           text,
  education           text,
  hometown            text,
  living_area         text,
  relationship_status text,
  connect_goal        text,
  birth_year          int check (birth_year between 1900 and 2100),
  gender              text check (gender in ('female', 'male', 'lgbtq')),
  province_code       text references app.provinces (code) on update cascade,
  intent              text not null default 'member' check (intent in ('member', 'host', 'venue', 'organizer')),
  goals               text[] not null default '{}',
  hidden_fields       text[] not null default '{workplace,relationshipStatus,age}',
  updated_at          timestamptz not null default now()
);
create index member_profiles_province_idx on app.member_profiles (province_code);
create trigger member_profiles_updated before update on app.member_profiles for each row execute function app.set_updated_at();

-- Category codes, not ids: staff can retire a category without touching members' picks
create table app.member_interests (
  member_id uuid not null references app.members (id) on delete cascade,
  pillar    text not null check (pillar in ('community', 'fair', 'place')),
  code      text not null,
  primary key (member_id, pillar, code)
);
create index member_interests_code_idx on app.member_interests (pillar, code);

-- Append-only history of what each member accepted
create table app.member_consents (
  id          uuid primary key default app.uuid_v7(),
  member_id   uuid not null references app.members (id) on delete cascade,
  kind        text not null check (kind in ('terms', 'pledge', 'age')),
  version     text not null,
  source      text not null check (source in ('signup_form', 'social_login', 'profile')),
  accepted_at timestamptz not null default now()
);
create index member_consents_member_idx on app.member_consents (member_id, kind, accepted_at desc);

create table app.host_applications (
  id           uuid primary key default app.uuid_v7(),
  member_id    uuid not null references app.members (id) on delete cascade,
  kind         text not null check (kind in ('host', 'venue', 'organizer')),
  about        text not null,
  link         text,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by  uuid references app.staff_accounts (id) on delete set null,
  reviewed_at  timestamptz,
  note         text
);
create index host_applications_member_idx on app.host_applications (member_id, submitted_at desc);
create index host_applications_pending_idx on app.host_applications (submitted_at) where status = 'pending';
create index host_applications_reviewer_idx on app.host_applications (reviewed_by);

create table app.member_risk_flags (
  id          uuid primary key default app.uuid_v7(),
  member_id   uuid not null references app.members (id) on delete cascade,
  code        text not null check (code in ('disposable_email', 'shared_ip', 'risky_name', 'risky_text', 'contact_info', 'reported')),
  detail      text not null default '',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references app.staff_accounts (id) on delete set null
);
create index member_risk_flags_member_idx on app.member_risk_flags (member_id);
create index member_risk_flags_open_idx on app.member_risk_flags (created_at) where reviewed_at is null;
create index member_risk_flags_reviewer_idx on app.member_risk_flags (reviewed_by);

-- Social graph

create table app.follows (
  follower_id uuid not null references app.members (id) on delete cascade,
  followee_id uuid not null references app.members (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on app.follows (followee_id);

create table app.blocks (
  blocker_id uuid not null references app.members (id) on delete cascade,
  blocked_id uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on app.blocks (blocked_id);

select app.secure_tables();
