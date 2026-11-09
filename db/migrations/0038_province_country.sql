-- Global plan (owner 2026-11-09, docs/LAUNCH_CHECKLIST.md "เตรียมพร้อม Global"): every province or city belongs to a
-- country, so cities abroad can be added later without changing today's codes. All current rows are Thai.

alter table app.provinces
  add column if not exists country_code text not null default 'TH'
    check (country_code ~ '^[A-Z]{2}$');

comment on column app.provinces.country_code is 'ISO 3166-1 alpha-2 country of this province or city (TH for all of today''s rows).';

create index if not exists provinces_country_idx on app.provinces (country_code);
