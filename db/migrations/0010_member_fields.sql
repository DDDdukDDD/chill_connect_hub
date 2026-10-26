-- Member fields the website stores today that 0003 had no place for.

-- Onboarding answers exist (Member.preferences); null = never answered
alter table app.member_profiles add column preferences_at timestamptz;
-- Staff looked at this member's flags and reports up to this time (Member.riskReviewedAt)
alter table app.members add column risk_reviewed_at timestamptz;
-- Staff accounts still live in staff_accounts.json, so the reviewer is kept as its id/name until staff move
alter table app.host_applications add column reviewed_by_label text;
