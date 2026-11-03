-- Phone check for members who open ตี้, challenges and trips (owner 2026-11-02). One verified number belongs to one account.
-- phone_verification holds the pending code: its hash, the number it went to, expiry, tries; never the code itself.
alter table app.members
  add column phone              text,
  add column phone_verified_at  timestamptz,
  add column phone_verification jsonb;

create unique index members_verified_phone_idx on app.members (phone) where phone_verified_at is not null;
