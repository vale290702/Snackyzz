alter table access.admins enable row level security;

-- Every active admin can read their own row; that's how the DAL builds the session.
create policy admins_select_own
on access.admins
for select
to authenticated
using (
  user_id = (select auth.uid())
  and archived_at is null
);

-- The team page lists the whole roster, archived admins included.
create policy admins_select_for_managers
on access.admins
for select
to authenticated
using ((select private.has_permission('admins.manage')));
