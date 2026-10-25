-- The permission map: the only place that says what each role may do. TypeScript reads it through
-- access.my_permissions(), so it is never duplicated.
create or replace function private.role_permissions(p_role access.admin_role)
returns access.permission[]
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'owner' then array[
      'orders.view',
      'orders.decide',
      'inventory.manage',
      'notifications.manage_own',
      'catalog.manage',
      'fulfillment.manage',
      'retail.manage',
      'themes.manage',
      'settings.manage',
      'admins.manage',
      'reports.view'
    ]::access.permission[]
    when 'staff' then array[
      'orders.view',
      'orders.decide',
      'inventory.manage',
      'notifications.manage_own'
    ]::access.permission[]
  end;
$$;

revoke execute on function private.role_permissions(access.admin_role) from public, anon, authenticated, service_role;

-- Called by RLS policies as (select private.has_permission('<permission>')). Security definer so the
-- lookup ignores the admins policies, which call this function themselves.
create or replace function private.has_permission(p_permission access.permission)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from access.admins as admins
    where admins.user_id = (select auth.uid())
      and admins.archived_at is null
      and p_permission = any (private.role_permissions(admins.role))
  );
$$;

revoke execute on function private.has_permission(access.permission) from public, anon, authenticated, service_role;

grant execute on function private.has_permission(access.permission) to authenticated;

-- Entry point for the TypeScript DAL: the signed-in admin's permissions, empty for archived admins
-- and for users who are not admins.
create or replace function access.my_permissions()
returns access.permission[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select private.role_permissions(admins.role)
      from access.admins as admins
      where admins.user_id = (select auth.uid())
        and admins.archived_at is null
    ),
    '{}'
  );
$$;

revoke execute on function access.my_permissions() from public, anon, authenticated, service_role;

grant execute on function access.my_permissions() to authenticated;

-- Integrity guard: a change may not leave the roster without an active owner. Locking the other
-- active owners serializes concurrent demotions, so two of them can't both see the other as the
-- remaining owner.
create or replace function private.guard_active_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining_owner_count integer;
begin
  select count(*)
  into v_remaining_owner_count
  from (
    select admins.user_id
    from access.admins as admins
    where admins.role = 'owner'
      and admins.archived_at is null
      and admins.user_id is distinct from old.user_id
    for update
  ) as remaining_owners;

  if v_remaining_owner_count = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'owner_required';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_active_owner() from public, anon, authenticated, service_role;

create trigger admins_guard_active_owner_on_insert
before insert on access.admins
for each row
when (
  new.role <> 'owner'
  or new.archived_at is not null
)
execute function private.guard_active_owner();

create trigger admins_guard_active_owner_on_update
before update of role, archived_at on access.admins
for each row
when (
  old.role = 'owner'
  and old.archived_at is null
  and (
    new.role <> 'owner'
    or new.archived_at is not null
  )
)
execute function private.guard_active_owner();

create trigger admins_guard_active_owner_on_delete
before delete on access.admins
for each row
when (
  old.role = 'owner'
  and old.archived_at is null
)
execute function private.guard_active_owner();
