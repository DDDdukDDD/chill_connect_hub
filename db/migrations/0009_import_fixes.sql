-- Fixes found while writing db/import-from-json.mjs.

-- Online ตี้ / อีเวนต์ have no province (today's data says 'ออนไลน์', which is not a province)
alter table app.events alter column province_code drop not null;
alter table app.events add constraint events_province_or_online check (province_code is not null or location_type = 'online');
alter table app.events alter column search_text set expression as (title || ' ' || location_name || ' ' || coalesce(province_code, ''));

-- A voucher reward shows the partner's own code (data/rewardsData.ts voucherCode); draw entries get one per redemption
alter table app.rewards add column partner_code text;
