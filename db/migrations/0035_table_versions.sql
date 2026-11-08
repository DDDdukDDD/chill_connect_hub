-- One version number per cached table, moved by every write (docs/DATABASE_REVIEW.md item 4).
-- Before this, "did anything change?" counted every row and summed updated_at: 153 ms per check on places,
-- the most database time after reading the whole table. Now it is one row read by key.
-- The number moves inside the writing transaction, so a reader sees it change exactly when the rows do.

create table app.table_versions (
  name       text primary key,
  version    bigint not null default 1,
  changed_at timestamptz not null default now()
);

create or replace function app.bump_table_version() returns trigger
language plpgsql as $$
begin
  insert into app.table_versions as v (name) values (tg_table_name)
  on conflict (name) do update set version = v.version + 1, changed_at = now();
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['events', 'places', 'quests', 'provinces', 'zones', 'categories', 'venues', 'venue_groups', 'community_clubs'] loop
    insert into app.table_versions (name) values (t);
    execute format('create trigger %I after insert or update or delete or truncate on app.%I for each statement execute function app.bump_table_version()', t || '_version', t);
  end loop;
end $$;

select app.secure_tables();
