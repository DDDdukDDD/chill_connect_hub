-- Sign in with Apple: the refresh token Apple gives at each sign-in, kept so that deleting the account can revoke it
-- (App Store Review 5.1.1(v), BE-427). Encrypted by the app (AES-256-GCM, lib/members/appleTokens.ts); the database
-- never sees it in the clear. One row per member, replaced on every Apple sign-in, gone with the member.
create table if not exists app.apple_tokens (
  member_id     uuid primary key references app.members (id) on delete cascade,
  refresh_token text not null,
  updated_at    timestamptz not null default now()
);
grant select, insert, update, delete on app.apple_tokens to app_runtime;
