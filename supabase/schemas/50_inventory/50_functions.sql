-- Shared by availability now and order reservations later. Missing tracked pools mean no stock.
create or replace function private.resolve_stock_level(
  p_variant_id uuid,
  p_pickup_location_id uuid default null
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select levels.id
  from inventory.stock_levels as levels
  join catalog.product_variants as variants
    on variants.id = levels.variant_id
  where variants.id = p_variant_id
    and variants.is_stock_tracked
    and (levels.pickup_location_id = p_pickup_location_id or levels.pickup_location_id is null)
  order by levels.pickup_location_id nulls last
  limit 1;
$$;

revoke all on function private.resolve_stock_level(uuid, uuid) from public, anon, authenticated, service_role;

-- The only stock writer. Lock the variant to serialize pool creation and set-to adjustments.
-- A zero initial quantity creates a pool without an invalid zero ledger movement.
create or replace function private.apply_stock_movement(
  p_variant_id uuid,
  p_quantity integer,
  p_reason inventory.movement_reason,
  p_pickup_location_id uuid default null,
  p_admin_id uuid default null,
  p_note text default null,
  p_set_quantity boolean default false
)
returns inventory.stock_levels
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function private.apply_stock_movement(uuid, integer, inventory.movement_reason, uuid, uuid, text, boolean)
from public, anon, authenticated, service_role;

create or replace function inventory.adjust_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_pickup_location_id uuid default null,
  p_note text default null
)
returns inventory.stock_levels
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function inventory.adjust_stock(uuid, integer, uuid, text) from public, anon, authenticated, service_role;

grant execute on function inventory.adjust_stock(uuid, integer, uuid, text) to authenticated;

-- Expose booleans only, and never reveal archived catalog rows through a definer.
create or replace function inventory.variant_availability(
  p_variant_ids uuid[],
  p_pickup_location_id uuid default null
)
returns table (variant_id uuid, is_available boolean)
language sql
stable
security definer
set search_path = ''
as $$
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
$$;

revoke all on function inventory.variant_availability(uuid[], uuid) from public, anon, authenticated, service_role;

grant execute on function inventory.variant_availability(uuid[], uuid) to anon, authenticated, service_role;
