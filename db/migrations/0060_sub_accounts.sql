-- Extra accounts a member makes and switches between, like Instagram (BE-393, owner 2026-11-16). A sub-account has no
-- email, password or social sign-in of its own: it is reached only by switching from its owner (or a sibling), and it
-- goes when the owner's account is deleted. Rules live in lib/members/subAccounts.ts.
alter table app.members add column owner_id uuid references app.members (id) on delete cascade;
alter table app.members add constraint members_owner_not_self check (owner_id is null or owner_id <> id);
create index members_owner_idx on app.members (owner_id) where owner_id is not null;

-- How many accounts this owner may hold, the main one included; null means the default (3, owner 2026-11-16).
-- Staff set it per member in the admin console.
alter table app.members add column account_limit smallint check (account_limit between 1 and 10);

-- No two members share a name (BE-394, owner 2026-11-16): the check compares names without case or spaces
-- (nameKey in lib/displayName.ts). Not unique in the database: older accounts may already share one, and the
-- placeholder "สมาชิกใหม่" is shared by everyone who has not finished onboarding. The app checks before saving.
create index members_name_key_idx on app.members (lower(regexp_replace(display_name, '[[:space:]]+', '', 'g')));
