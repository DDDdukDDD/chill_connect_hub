-- What the author allows on a post, and which part of a longer clip it plays (owner 2026-11-02).
alter table app.moments
  add column comments_off  boolean not null default false,
  add column likes_off     boolean not null default false,
  add column shares_off    boolean not null default false,
  add column video_start_s real not null default 0 check (video_start_s >= 0);
