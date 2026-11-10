-- Friends hear when a friend joins a ตี้ ('friend_going', lib/social/notifications.ts notifyFriendsGoing).
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'reply', 'comment_like', 'tagged', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined', 'draw_won', 'draw_result', 'tee_changed', 'trip_cancelled', 'invite', 'invite_yes', 'friend_going'));
