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

-- catalog: the primary brand, one collab brand, sample products (not the real menu). Fixed ids keep
-- demo links stable. Images are uploaded through the admin, so none are seeded.
-- No created_by: the seed is not an admin, and tests archive or remove the demo admins.
insert into catalog.brands (
  id,
  slug,
  name,
  description,
  label,
  is_primary,
  sort_order
)
values
  (
    '00000000-0000-7000-8000-0000000000b1',
    'snackyzz',
    'Snackyzz',
    'Cookies Snackyzz selladas, listas para acompañar tu próximo break.',
    'Snackyzz · Selladas',
    true,
    0
  ),
  (
    '00000000-0000-7000-8000-0000000000b2',
    'baking-stereo',
    'Snackyzz X Baking Stereo',
    'Cookies de Baking Stereo recién salidas del horno. Otro antojo, el mismo carrito.',
    'Baking Stereo · Recién horneadas',
    false,
    1
  );

insert into catalog.categories (
  id,
  slug,
  name,
  sort_order
)
values
  (
    '00000000-0000-7000-8000-0000000000c1',
    'clasicas',
    'Clásicas',
    0
  ),
  (
    '00000000-0000-7000-8000-0000000000c2',
    'chocolate',
    'Chocolate',
    1
  );

insert into catalog.products (
  id,
  brand_id,
  slug,
  name,
  description,
  badge,
  accent_color,
  sort_order
)
values
  (
    '00000000-0000-7000-8000-0000000000d1',
    '00000000-0000-7000-8000-0000000000b1',
    'choco-cloud',
    'Choco Cloud',
    'Una galleta de muestra con chispas de chocolate y un centro suave.',
    'La clásica',
    '#ED781A',
    0
  ),
  (
    '00000000-0000-7000-8000-0000000000d2',
    '00000000-0000-7000-8000-0000000000b2',
    'chocolate-chip',
    'Chocolate Chip',
    'Cookie de muestra con chispas de chocolate, recién horneada.',
    null,
    '#3C1907',
    0
  );

insert into catalog.product_categories (product_id, category_id)
values
  ('00000000-0000-7000-8000-0000000000d1', '00000000-0000-7000-8000-0000000000c1'),
  ('00000000-0000-7000-8000-0000000000d1', '00000000-0000-7000-8000-0000000000c2'),
  ('00000000-0000-7000-8000-0000000000d2', '00000000-0000-7000-8000-0000000000c2');

-- Choco Cloud has a single variant (a simple product); Chocolate Chip shows the variant picker.
insert into catalog.product_variants (
  id,
  product_id,
  sku,
  name,
  price,
  is_default,
  sort_order
)
values
  (
    '00000000-0000-7000-8000-0000000000e1',
    '00000000-0000-7000-8000-0000000000d1',
    'SNK-CHOCO-CLOUD',
    'Unidad',
    2500,
    true,
    0
  ),
  (
    '00000000-0000-7000-8000-0000000000e2',
    '00000000-0000-7000-8000-0000000000d2',
    'BKS-CHOCOLATE-CHIP',
    'Unidad',
    2800,
    true,
    0
  ),
  (
    '00000000-0000-7000-8000-0000000000e3',
    '00000000-0000-7000-8000-0000000000d2',
    'BKS-CHOCOLATE-CHIP-6',
    'Caja de 6',
    15000,
    false,
    1
  );

-- fulfillment: one sample pickup location with weekday hours, two delivery zones and today's
-- delivery schedule (Mon–Fri 9:00–18:00, Sat 9:00–15:00). Fixed ids keep demo links stable; the
-- settings row comes from the fulfillment data migration. No created_by, as for catalog.
insert into fulfillment.pickup_locations (
  id,
  name,
  address,
  city,
  map_url,
  instructions,
  sort_order
)
values (
  '00000000-0000-7000-8000-0000000001a1',
  'Snackyzz Escazú',
  'Dirección de muestra, 200 m al oeste del parque',
  'Escazú',
  'https://maps.google.com/?q=Escazu',
  'Toca el timbre de la puerta lateral.',
  0
);

insert into fulfillment.pickup_location_hours (
  pickup_location_id,
  weekday,
  opens_at,
  closes_at
)
select
  '00000000-0000-7000-8000-0000000001a1',
  weekdays.weekday,
  '10:00',
  '18:00'
from generate_series(1, 6) as weekdays (weekday);

insert into fulfillment.delivery_zones (
  id,
  name,
  fee,
  sort_order
)
values
  (
    '00000000-0000-7000-8000-0000000001b1',
    'Escazú',
    1500,
    0
  ),
  (
    '00000000-0000-7000-8000-0000000001b2',
    'San José centro',
    2500,
    1
  );

insert into fulfillment.delivery_hours (
  weekday,
  opens_at,
  closes_at
)
select
  weekdays.weekday,
  '09:00',
  case when weekdays.weekday = 6 then '15:00'::time else '18:00'::time end
from generate_series(1, 6) as weekdays (weekday);
