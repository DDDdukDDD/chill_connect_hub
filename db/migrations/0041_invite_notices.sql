-- "ไปกันไหม" (owner 2026-11-10): a member sends a post to a friend as an invitation ('invite'), and the friend can
-- answer "ไปด้วย" ('invite_yes'). Both are ordinary notices (lib/social/notifications.ts notifyInvite, notifyInviteYes).
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes'));
