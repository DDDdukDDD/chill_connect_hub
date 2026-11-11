-- Short "ชวนไป" links for LINE (owner 2026-11-11): a long signed link looked like spam in a chat. A friend now gets
-- www.chillwaa.com/i/<code>; the code names the signed invitation and the page it opens (lib/social/inviteLinkStore.ts).
-- One code per invitation, made the first time it is shared and reused after that.
create table app.invite_links (
  code       text primary key,
  token      text not null unique,
  path       text not null,
  created_at timestamptz not null default now()
);

comment on table app.invite_links is 'Short codes for "ชวนไป" links: /i/<code> opens <path>?invite=<token>.';

alter table app.invite_links enable row level security;
alter table app.invite_links force row level security;
create policy runtime_all on app.invite_links to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.invite_links to app_runtime;
