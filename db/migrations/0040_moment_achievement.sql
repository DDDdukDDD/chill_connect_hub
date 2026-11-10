-- Feed plan step 3.5 (docs/FEED_PLAN.md): a post that counted toward a challenge says so ("พิชิตชาเลนจ์สายคาเฟ่ 2/3").
-- Worked out once when the post is made (POST /api/moments) and kept, so a feed never reads anyone's progress.
-- Written by its own update (pgMomentRepository.setAchievement): before this runs, posting still works and the line is skipped.
alter table app.moments add column if not exists achievement jsonb;

comment on column app.moments.achievement is 'The challenge this post counted toward when posted: { questId, title, current, total }. Null for most posts.';
