-- Staff accounts are read from this table now. An account made by the env owner has no creator row, so keep who made it as text.
alter table app.staff_accounts add column created_by_note text;
