-- Rewards in the admin console + several draw entries per member (BE-391, owner 2026-11-08).
-- Staff now edit the catalog in app.rewards (lib/rewards/catalog.ts) instead of data/rewardsData.ts, so the fields
-- that only lived in code move here. Entry limits (maxPerMember, perDay) and the draw date live in draw_entry.
-- The app reads rewards with to_jsonb, so the site keeps working before this runs; a second entry needs it.
alter table app.rewards add column image text;
alter table app.rewards add column emoji text not null default '';
alter table app.rewards add column campaign_only boolean not null default false;

-- A draw may be redeemed more than once now; the per-member limit is checked under the redeem lock
drop index if exists app.reward_redemptions_once_idx;
create index reward_redemptions_member_reward_idx on app.reward_redemptions (member_id, reward_id, created_at);

-- What data/rewardsData.ts said for the rows already here; a draw date staff set already wins
update app.rewards set image = '/campaign/iphone-duo.png', emoji = '🎁', campaign_only = false, draw_entry = jsonb_build_object('drawDate', '2027-01-15') || draw_entry where slug = 'reward-launch-iphone';
update app.rewards set image = '/campaign/flight-phuket.png', emoji = '✈️', campaign_only = true, draw_entry = jsonb_build_object('drawDate', '2027-01-15') || draw_entry where slug = 'reward-flight-phuket';
update app.rewards set image = '/campaign/flight-japan.png', emoji = '✈️', campaign_only = true, draw_entry = jsonb_build_object('drawDate', '2027-01-15') || draw_entry where slug = 'reward-flight-japan';
update app.rewards set image = '/campaign/flight-china.png', emoji = '✈️', campaign_only = true, draw_entry = jsonb_build_object('drawDate', '2027-01-15') || draw_entry where slug = 'reward-flight-china';
update app.rewards set image = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', emoji = '☕', campaign_only = false where slug = 'reward-1';
update app.rewards set image = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80', emoji = '🎲', campaign_only = false where slug = 'reward-2';
update app.rewards set image = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80', emoji = '🎽', campaign_only = false where slug = 'reward-3';
update app.rewards set image = 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=800&q=80', emoji = '🏃', campaign_only = false where slug = 'reward-4';
update app.rewards set image = 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80', emoji = '☕', campaign_only = false where slug = 'reward-5';
update app.rewards set image = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80', emoji = '🎨', campaign_only = false where slug = 'reward-6';
update app.rewards set image = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', emoji = '🎽', campaign_only = false where slug = 'reward-7';
update app.rewards set image = 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=800&q=80', emoji = '🍹', campaign_only = false where slug = 'reward-8';
