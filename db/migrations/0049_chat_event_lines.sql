-- Lines the site writes into a chat for a member (a plan's day set, "ไปด้วยนะ!") show as a grey line in the middle,
-- like LINE's notes, not as a bubble someone typed (BE-359). They cannot be deleted or reported.
alter table app.chat_messages
  add column kind text not null default 'text' check (kind in ('text', 'event'));
