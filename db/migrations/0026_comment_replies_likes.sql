-- Replies to and likes on moment comments (owner 2026-11-05). One level: a reply to a reply sits under the same comment.
alter table app.moment_comments
  add column parent_id uuid references app.moment_comments (id) on delete cascade;
create index moment_comments_parent_idx on app.moment_comments (parent_id) where parent_id is not null;

create table app.moment_comment_likes (
  comment_id uuid not null references app.moment_comments (id) on delete cascade,
  member_id  uuid not null references app.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, member_id)
);
create index moment_comment_likes_member_idx on app.moment_comment_likes (member_id);

alter table app.moment_comment_likes enable row level security;
alter table app.moment_comment_likes force row level security;
create policy runtime_all on app.moment_comment_likes to app_runtime using (true) with check (true);
grant select, insert, update, delete on app.moment_comment_likes to app_runtime;

alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed'));
