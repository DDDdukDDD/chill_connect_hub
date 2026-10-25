-- Foundation: extensions, the private app schema, the website's role and shared helpers.
-- See docs/DATABASE_DESIGN.md §2 and §5.

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists postgis with schema extensions;

-- Tables live in "app", which Supabase's Data API does not expose. Nobody but our server reaches it.
create schema if not exists app;
revoke all on schema app from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on schema app from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on schema app from authenticated'; end if;
end $$;

-- The website connects as app_runtime: data only, no DDL. Its login password is set by db/setup-runtime-login.mjs.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    create role app_runtime nologin noinherit;
  end if;
end $$;
grant usage on schema app, extensions to app_runtime;
alter role app_runtime set search_path = app, extensions;
alter role app_runtime set statement_timeout = '5s';
alter role app_runtime set lock_timeout = '3s';
alter role app_runtime set idle_in_transaction_session_timeout = '10s';

-- Time-ordered UUIDs (v7): new rows land at the end of the index. The app may also generate them.
create or replace function app.uuid_v7() returns uuid
language sql volatile parallel safe as $$
  select encode(
    set_bit(set_bit(
      overlay(uuid_send(gen_random_uuid())
        placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
        from 1 for 6),
      52, 1), 53, 1),
    'hex')::uuid
$$;

create or replace function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Locks every app table: RLS on, one policy for app_runtime, nothing for anyone else.
-- Every migration that adds tables calls this at the end.
create or replace function app.secure_tables() returns void
language plpgsql as $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'app' and c.relkind in ('r', 'p') and c.relname <> 'schema_migrations'
  loop
    execute format('alter table app.%I enable row level security', t.relname);
    execute format('alter table app.%I force row level security', t.relname);
    if not exists (select 1 from pg_policies where schemaname = 'app' and tablename = t.relname and policyname = 'runtime_all') then
      execute format('create policy runtime_all on app.%I to app_runtime using (true) with check (true)', t.relname);
    end if;
    -- History tables are append-only for the website
    if t.relname in ('xp_ledger', 'audit_log') then
      execute format('grant select, insert on app.%I to app_runtime', t.relname);
      execute format('revoke update, delete, truncate on app.%I from app_runtime', t.relname);
    else
      execute format('grant select, insert, update, delete on app.%I to app_runtime', t.relname);
    end if;
  end loop;
  execute 'grant usage, select on all sequences in schema app to app_runtime';
end $$;
