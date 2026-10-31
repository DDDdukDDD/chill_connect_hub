-- LINE joins Google, Facebook and Apple as a sign-in provider.
alter table app.members drop constraint members_last_login_method_check;
alter table app.members add constraint members_last_login_method_check
  check (last_login_method in ('email', 'google', 'facebook', 'apple', 'line'));
alter table app.member_auth_providers drop constraint member_auth_providers_provider_check;
alter table app.member_auth_providers add constraint member_auth_providers_provider_check
  check (provider in ('google', 'facebook', 'apple', 'line'));
