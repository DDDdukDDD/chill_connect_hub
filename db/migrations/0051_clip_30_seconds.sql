-- Clips may run 30 seconds since 2026-11-09 (MAX_VIDEO_SECONDS + VIDEO_SECONDS_GRACE in lib/moments/types.ts), but the
-- column still allowed 15.5 from 0015, so every longer clip failed to post with a 500 (BE-371).
alter table app.moments drop constraint if exists moments_video_duration_s_check;
alter table app.moments add constraint moments_video_duration_s_check check (video_duration_s > 0 and video_duration_s <= 30.5);
