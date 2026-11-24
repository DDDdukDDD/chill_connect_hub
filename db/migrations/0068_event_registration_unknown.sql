-- Sign-up state of an อีเวนต์ (BE-466, owner 2026-11-24): open, closed, or not known. It was "not null default true",
-- so every อีเวนต์ said "เปิดรับสมัครอยู่" on its page although nobody knew. Null now means not known: the page then
-- says nothing. Kept: false (closed by staff, the ThaiRun import or the end-of-event job) and true from the ThaiRun
-- import, which reads it from the race page. ตี้ stay true/false (the moments queries read them as open to join).
-- Run before the code that writes null is deployed; the old code writes only true/false, so it keeps working after.
alter table app.events alter column registration_open drop not null;
update app.events set registration_open = null
 where event_type = 'public_venue' and registration_open and coalesce(source_name, '') not ilike '%thairun%';
