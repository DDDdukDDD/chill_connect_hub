-- Database review items 5, 6 and part of 8 (docs/DATABASE_REVIEW.md): remove what nothing reads.

-- 5. Photos are read from places.details.galleryImages; this copy was only rewritten on every place save
drop table app.place_images;

-- 6. Replaced or never used: rate limits live in app.rate_limits, source runs in sources.extra.lastRun*,
--    and the one api_usage row only came from the JSON import
drop table app.rate_limit_hits;
drop table app.import_runs;
drop table app.api_usage;

-- 6. The waitlist is its own table (app.event_waitlist); event_participants only ever holds joined or cancelled
drop index app.event_participants_waitlist_idx;
alter table app.event_participants drop constraint event_participants_status_check;
alter table app.event_participants add constraint event_participants_status_check check (status in ('joined', 'cancelled'));
alter table app.event_participants drop column offered_at;

-- 8. Sponsored cards name one of the four list pages (lib/sponsored/types.ts SPONSOR_PILLARS).
--    item_id stays plain text: it is the public id of a ตี้/อีเวนต์, place or challenge, so no single table to point at
alter table app.sponsored_slots add constraint sponsored_slots_pillar_check check (pillar in ('community', 'events', 'spots', 'challenges'));
