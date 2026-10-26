-- The JSON stores kept places, challenges and events in list order (new items first), and some lists show that order.
-- sort_key keeps it: higher = earlier in the list. Imported rows get small numbers, new rows get the time in ms.
alter table app.places add column sort_key bigint not null default 0;
alter table app.quests add column sort_key bigint not null default 0;
alter table app.events add column sort_key bigint not null default 0;
create index places_sort_idx on app.places (sort_key desc);
create index quests_sort_idx on app.quests (sort_key desc);
create index events_sort_idx on app.events (sort_key desc);
