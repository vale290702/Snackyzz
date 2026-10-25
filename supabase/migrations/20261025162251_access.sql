set local check_function_bodies = off;

create schema "access";

create table "access"."admins" (
  "user_id"      uuid                     not null,
  "display_name" text                     not null,
  "archived_at"  timestamp with time zone,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  "created_by"   uuid,
  "updated_by"   uuid,
  constraint "admins_display_name_check"
    check (((char_length(display_name) >= 1) AND (char_length(display_name) <= 80))),
  constraint "admins_pkey" primary key (user_id)
);

alter table "access"."admins"
  enable row level security;

create type "access"."admin_role" as enum (
  'owner',
  'staff'
);

alter table "access"."admins"
  add column "role" access.admin_role not null default 'staff'::access.admin_role;

create type "access"."permission" as enum (
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
);

create or replace function access.my_permissions()
  returns access.permission[]
  language sql
  stable
  security definer
  set search_path to ''
  AS $function$
  select coalesce(
    (
      select private.role_permissions(admins.role)
      from access.admins as admins
      where admins.user_id = (select auth.uid())
        and admins.archived_at is null
    ),
    '{}'
  );
$function$;

create or replace function private.guard_active_owner()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
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
$function$;

create or replace function private.has_permission (
  p_permission access.permission
)
  returns boolean
  language sql
  stable
  security definer
  set search_path to ''
  AS $function$
  select exists (
    select 1
    from access.admins as admins
    where admins.user_id = (select auth.uid())
      and admins.archived_at is null
      and p_permission = any (private.role_permissions(admins.role))
  );
$function$;

create or replace function private.role_permissions (
  p_role access.admin_role
)
  returns access.permission[]
  language sql
  immutable
  set search_path to ''
  AS $function$
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
$function$;

alter table "access"."admins"
  add constraint "admins_created_by_fkey" foreign key (created_by) references access.admins(user_id);

alter table "access"."admins"
  add constraint "admins_updated_by_fkey" foreign key (updated_by) references access.admins(user_id);

alter table "access"."admins"
  add constraint "admins_user_id_fkey" foreign key (user_id) references auth.users(id)
    on delete restrict;

create index admins_created_by_idx on access.admins using btree (created_by);

create index admins_updated_by_idx on access.admins using btree (updated_by);

create trigger admins_guard_active_owner_on_delete
  before delete on access.admins
  for each row
  when (((old.role = 'owner'::access.admin_role) AND (old.archived_at IS NULL)))
  execute function private.guard_active_owner();

create trigger admins_guard_active_owner_on_insert
  before insert on access.admins
  for each row
  when (((new.role <> 'owner'::access.admin_role) OR (new.archived_at IS NOT NULL)))
  execute function private.guard_active_owner();

create trigger admins_guard_active_owner_on_update
  before update of role, archived_at on access.admins
  for each row
  when
    (((old.role = 'owner'::access.admin_role) AND (old.archived_at IS NULL) AND ((new.role <>
    'owner'::access.admin_role) OR (new.archived_at IS NOT NULL))))
  execute function private.guard_active_owner();

create trigger admins_set_updated_at
  before update on access.admins
  for each row
  execute function private.set_updated_at();

create policy "admins_select_for_managers" on "access"."admins"
  for select
  to "authenticated"
  using (( select private.has_permission('admins.manage'::access.permission) as has_permission));

create policy "admins_select_own" on "access"."admins"
  for select
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND (archived_at is null)));

revoke all on function "access"."my_permissions"() from public;

grant execute on function "access"."my_permissions"() to "authenticated";

revoke all on function "private"."guard_active_owner"() from public;

revoke all on function "private"."has_permission"(access.permission) from public;

grant execute on function "private"."has_permission"(access.permission) to "authenticated";

revoke all on function "private"."role_permissions"(access.admin_role) from public;

grant usage on schema "access" to "authenticated", "service_role";

grant select on table "access"."admins" to "authenticated";

grant insert, select, update on table "access"."admins" to "service_role";
