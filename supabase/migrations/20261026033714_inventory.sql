set local check_function_bodies = off;

create schema "inventory";

create table "inventory"."stock_levels" (
  "variant_id"         uuid                     not null,
  "pickup_location_id" uuid,
  "is_global"          boolean                  generated always as ((pickup_location_id is null))
    stored,
  "quantity_available" integer                  not null default 0,
  "created_at"         timestamp with time zone not null default now(),
  "updated_at"         timestamp with time zone not null default now(),
  constraint "stock_levels_quantity_available_check" check ((quantity_available >= 0)),
  constraint "stock_levels_variant_id_pickup_location_id_key" unique nulls
    not DISTINCT (variant_id, pickup_location_id),
  "id"                 uuid                     not null default private.uuid_v7(),
  constraint "stock_levels_pkey" primary key (id)
);

alter table "inventory"."stock_levels"
  enable row level security;

create table "inventory"."stock_movements" (
  "stock_level_id" uuid    not null,
  "quantity_delta" integer not null,
  constraint "stock_movements_quantity_delta_check" check ((quantity_delta <> 0)),
  "id"             uuid    not null default private.uuid_v7(),
  constraint "stock_movements_pkey" primary key (id)
);

alter table "inventory"."stock_movements"
  enable row level security;

create type "inventory"."movement_reason" as enum (
  'adjustment',
  'restock',
  'waste',
  'order_reservation',
  'order_release'
);

alter table "inventory"."stock_movements"
  add column "reason" inventory.movement_reason not null;

alter table "inventory"."stock_movements"
  add column "note" text;

alter table "inventory"."stock_movements"
  add column "created_by" uuid;

alter table "inventory"."stock_movements"
  add column "created_at" timestamp with time zone not null default now();

create or replace function inventory.adjust_stock (
  p_variant_id         uuid,
  p_quantity           integer,
  p_pickup_location_id uuid    default null::uuid,
  p_note               text    default null::text
)
  returns inventory.stock_levels
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
begin
  if not private.has_permission('inventory.manage') then
    raise insufficient_privilege using message = 'permission_denied';
  end if;

  if p_quantity is null or p_quantity < 0 then
    raise exception 'invalid_stock_quantity';
  end if;

  return private.apply_stock_movement(
    p_variant_id => p_variant_id,
    p_quantity => p_quantity,
    p_reason => 'adjustment',
    p_pickup_location_id => p_pickup_location_id,
    p_admin_id => auth.uid(),
    p_note => p_note,
    p_set_quantity => true
  );
end;
$function$;

create or replace function inventory.variant_availability (
  p_variant_ids        uuid[],
  p_pickup_location_id uuid   default null::uuid
)
  returns table (
    variant_id   uuid,
    is_available boolean
  )
  language sql
  stable
  security definer
  set search_path to ''
  AS $function$
  select
    variants.id,
    not variants.is_stock_tracked or coalesce(levels.quantity_available > 0, false)
  from catalog.product_variants as variants
  join catalog.products as products on products.id = variants.product_id
  join catalog.brands as brands on brands.id = products.brand_id
  left join inventory.stock_levels as levels
    on levels.id = private.resolve_stock_level(variants.id, p_pickup_location_id)
  where variants.id = any(p_variant_ids)
    and variants.archived_at is null
    and products.archived_at is null
    and brands.archived_at is null;
$function$;

create or replace function private.apply_stock_movement (
  p_variant_id         uuid,
  p_quantity           integer,
  p_reason             inventory.movement_reason,
  p_pickup_location_id uuid                      default null::uuid,
  p_admin_id           uuid                      default null::uuid,
  p_note               text                      default null::text,
  p_set_quantity       boolean                   default false
)
  returns inventory.stock_levels
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
declare
  v_level inventory.stock_levels;
  v_delta integer;
begin
  perform 1 from catalog.product_variants
  where id = p_variant_id and archived_at is null and is_stock_tracked
  for update;
  if not found then
    raise exception 'variant_not_stock_tracked';
  end if;

  if p_quantity is null or p_set_quantity is null or p_reason is null then
    raise exception 'invalid_stock_movement';
  end if;
  if p_pickup_location_id is not null and not exists (
    select 1 from fulfillment.pickup_locations
    where id = p_pickup_location_id and archived_at is null
  ) then
    raise exception 'pickup_location_not_found';
  end if;

  insert into inventory.stock_levels (variant_id, pickup_location_id)
  values (p_variant_id, p_pickup_location_id)
  on conflict (variant_id, pickup_location_id) do nothing;

  select * into strict v_level from inventory.stock_levels
  where variant_id = p_variant_id and pickup_location_id is not distinct from p_pickup_location_id
  for update;
  v_delta := case when p_set_quantity then p_quantity - v_level.quantity_available else p_quantity end;
  if v_delta = 0 then
    return v_level;
  end if;

  update inventory.stock_levels set quantity_available = quantity_available + v_delta
  where id = v_level.id returning * into v_level;

  insert into inventory.stock_movements (stock_level_id, quantity_delta, reason, created_by, note)
  values (v_level.id, v_delta, p_reason, p_admin_id, p_note);

  return v_level;
end;
$function$;

create or replace function private.resolve_stock_level (
  p_variant_id         uuid,
  p_pickup_location_id uuid default null::uuid
)
  returns uuid
  language sql
  stable
  security definer
  set search_path to ''
  AS $function$
  select levels.id
  from inventory.stock_levels as levels
  join catalog.product_variants as variants
    on variants.id = levels.variant_id
  where variants.id = p_variant_id
    and variants.is_stock_tracked
    and (levels.pickup_location_id = p_pickup_location_id or levels.pickup_location_id is null)
  order by levels.pickup_location_id nulls last
  limit 1;
$function$;

alter table "inventory"."stock_levels"
  add constraint "stock_levels_pickup_location_id_fkey" foreign key (pickup_location_id)
    references fulfillment.pickup_locations(id);

alter table "inventory"."stock_levels"
  add constraint "stock_levels_variant_id_fkey" foreign key (variant_id)
    references catalog.product_variants(id);

alter table "inventory"."stock_movements"
  add constraint "stock_movements_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "inventory"."stock_movements"
  add constraint "stock_movements_note_check"
    check (((char_length(note) >= 1) AND (char_length(note) <= 500)));

alter table "inventory"."stock_movements"
  add constraint "stock_movements_reason_check"
    check
    ((reason = ANY (ARRAY['adjustment'::inventory.movement_reason,
    'restock'::inventory.movement_reason, 'waste'::inventory.movement_reason])));

create index stock_levels_pickup_location_id_idx on inventory.stock_levels
  using btree (pickup_location_id);

create index stock_movements_created_by_idx on inventory.stock_movements using btree (created_by);

create trigger stock_levels_set_updated_at
  before update on inventory.stock_levels
  for each row
  execute function private.set_updated_at();

create policy "stock_levels_select_for_managers" on "inventory"."stock_levels"
  for select
  to "authenticated"
  using (( select private.has_permission('inventory.manage'::access.permission) as has_permission));

create policy "stock_movements_select_for_managers" on "inventory"."stock_movements"
  for select
  to "authenticated"
  using (( select private.has_permission('inventory.manage'::access.permission) as has_permission));

revoke all on function "inventory"."adjust_stock"(uuid, integer, uuid, text) from public;

grant execute on function "inventory"."adjust_stock"(uuid, integer, uuid, text) to "authenticated";

revoke all on function "inventory"."variant_availability"(uuid[], uuid) from public;

grant execute
  on function "inventory"."variant_availability"(uuid[], uuid)
  to "anon", "authenticated", "service_role";

revoke all
  on function
    "private"."apply_stock_movement"(uuid, integer, inventory.movement_reason, uuid, uuid, text,
    boolean)
  from public;

revoke all on function "private"."resolve_stock_level"(uuid, uuid) from public;

grant usage on schema "inventory" to "anon", "authenticated", "service_role";

grant select on table "inventory"."stock_levels" to "authenticated", "service_role";

grant select on table "inventory"."stock_movements" to "authenticated", "service_role";

alter table "inventory"."stock_movements"
  add constraint "stock_movements_stock_level_id_fkey" foreign key (stock_level_id)
    references inventory.stock_levels(id);

create index stock_movements_stock_level_id_id_idx on inventory.stock_movements
  using btree (stock_level_id, id);
