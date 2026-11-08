-- People named with "@" in a moment comment (owner 2026-11-07), as { id, name } with the member's legacy id and the
-- name when posted, so the text links to their profiles. Caption mentions are tags (app.moment_tags) and need nothing new.
alter table app.moment_comments add column mentions jsonb;
