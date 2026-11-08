-- Database review item 7 (docs/DATABASE_REVIEW.md). Owner 2026-11-08: participants_count is the members who joined, never
-- the host. The host keeps a joined row (their schedule, check-in) but takes no seat; max_participants is seats for members.
-- อีเวนต์ carried scraped numbers with no joins behind them; they now count real joins too (the page shows no count anyway).
-- Sample ตี้ keep their shown numbers: they have no join rows and are removed before launch.

comment on column app.events.participants_count is
  'Members with a joined row, the host not included (owner 2026-11-08). Seats left = max_participants - participants_count.';

with counted as (
  select e.id,
         (select count(*)::int from app.event_participants p
           where p.event_id = e.id and p.status = 'joined' and p.member_id is distinct from e.host_member_id) as members
  from app.events e
  where not e.is_sample
)
update app.events e
set participants_count = c.members,
    details = case
      when e.event_type = 'community' and e.max_participants is not null and c.members >= e.max_participants
        then e.details || '{"status":"full"}'::jsonb
      when e.event_type = 'community' and e.details->>'status' = 'full'
        then e.details || '{"status":"recruiting"}'::jsonb
      else e.details end
from counted c
where c.id = e.id and e.participants_count is distinct from c.members;
