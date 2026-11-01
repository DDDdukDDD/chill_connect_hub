-- A moment may hold one short clip (trial, owner 2026-11-02). Its first frame stays in moment_images as the poster.
alter table app.moments
  add column video_url        text,
  add column video_duration_s real check (video_duration_s > 0 and video_duration_s <= 15.5);
