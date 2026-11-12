-- Chat messages reach people who are not looking (BE-357): an unread count per room and one phone notification per
-- unread stretch. chat_room_members (0008) now gets a row for everyone in a room when someone writes there.

-- When this member's phone was last told about this room; quiet again until they read it (lib/social/chatPush.ts)
alter table app.chat_room_members add column notified_at timestamptz;

-- "Which rooms of mine have something new" reads the member's rooms, newest talk first
create index if not exists chat_rooms_last_message_idx on app.chat_rooms (last_message_at desc);
