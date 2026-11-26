-- The author's choice (owner 2026-11-27): a trip for everyone shows only to followers until its last day has passed,
-- so strangers cannot tell the author is away from home right now. Off unless the author turns it on.
alter table app.trips add column followers_until_back boolean not null default false;
