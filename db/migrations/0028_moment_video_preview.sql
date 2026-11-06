-- A clip's small silent preview (3 s, 360 px) that feeds and grids autoplay; the full clip loads only when someone opens it.
-- Clips posted before this have none and show their cover until tapped.
alter table app.moments add column video_preview_url text;
