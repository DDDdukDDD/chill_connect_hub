-- Notifications move from a per-server file to this table (owner 2026-11-02): the kinds added since 0008, where an
-- "approved" notice leads, and which comment a notice is about, so deleting the comment removes its notice.
alter table app.notifications drop constraint notifications_type_check;
alter table app.notifications
  add constraint notifications_type_check check (type in ('follow', 'like', 'comment', 'challenge', 'evidence', 'match', 'seat', 'question', 'answer', 'approved', 'rejected', 'joined')),
  add column path        text,
  add column comment_ref text;
