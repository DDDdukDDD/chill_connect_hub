-- Row level security on the two tables that were added without it (tester TR-031, TR-034), the same way as every
-- other table in app (0059_pending_joins.sql): only the app's own role may touch them; db/verify-security.mjs checks it.
alter table app.circle_events enable row level security;
alter table app.circle_events force row level security;
create policy runtime_all on app.circle_events to app_runtime using (true) with check (true);

alter table app.apple_tokens enable row level security;
alter table app.apple_tokens force row level security;
create policy runtime_all on app.apple_tokens to app_runtime using (true) with check (true);
