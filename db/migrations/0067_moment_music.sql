-- The library song under a clip (BE-446, owner 2026-11-21): shown on the clip, and the song sheet lists the clips that
-- use it. An id from lib/media/musicLibrary.ts, checked by the server; empty for clips without a song. Code reads it
-- only when present and writes it only for a clip with a song, so posting keeps working before this runs.
alter table app.moments add column if not exists video_music_id text;
alter table app.moments drop constraint if exists moments_video_music_id_check;
alter table app.moments
  add constraint moments_video_music_id_check check (video_music_id is null or (video_url is not null and video_music_id ~ '^[a-z0-9-]{1,60}$'));
create index if not exists moments_video_music_id_idx on app.moments (video_music_id, created_at desc) where video_music_id is not null;
