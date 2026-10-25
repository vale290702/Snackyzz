-- Deterministic demo data, loaded by `supabase db reset`. Never production data.
-- Each feature appends its demo rows here as its tables land.

-- access: one demo owner and one demo staff member. Local password for both: snackyzz-demo.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  demo_users.id,
  'authenticated',
  'authenticated',
  demo_users.email,
  extensions.crypt('snackyzz-demo', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('00000000-0000-7000-8000-000000000001'::uuid, 'owner@snackyzz.test'),
    ('00000000-0000-7000-8000-000000000002'::uuid, 'staff@snackyzz.test')
) as demo_users (id, email);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  users.id,
  users.id,
  users.id::text,
  'email',
  jsonb_build_object(
    'sub', users.id::text,
    'email', users.email,
    'email_verified', true
  ),
  now(),
  now(),
  now()
from auth.users as users
where users.email in ('owner@snackyzz.test', 'staff@snackyzz.test');

-- The owner goes first: a staff-only roster would break the active-owner guard.
insert into access.admins (user_id, display_name, role)
values ('00000000-0000-7000-8000-000000000001', 'Demo Owner', 'owner');

insert into access.admins (user_id, display_name, role, created_by)
values (
  '00000000-0000-7000-8000-000000000002',
  'Demo Staff',
  'staff',
  '00000000-0000-7000-8000-000000000001'
);
