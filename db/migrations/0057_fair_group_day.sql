-- The day a group inside an อีเวนต์ meets (BE-386): a fair runs for days, and "13:30" alone did not say which.
-- Null for groups made before this; the app reads it with to_jsonb, so it also runs before this migration.
alter table app.fair_groups add column meet_date date;
