# features/access

## Purpose

Who can use the admin panel and what they may do: sign-in, sessions, the admin roster, roles (`owner`, `staff`) and permissions.

## Owns / does not own

- **Owns:** schema `access` (admins), `private.role_permissions` / `private.has_permission`, `access.my_permissions()`, the sign-in page and the admin Team page.
- **Does not own:** Supabase Auth itself (`src/integrations/supabase`) or per-feature RLS policies (each feature's schema files call `private.has_permission`).

## Public API (`index.ts`)

- Types: `Admin` (`id`, `displayName`, `role`), `AdminRole`, `Permission` (from the generated `access` enums), `AdminContext` (`CapabilityContext<DatabaseClient, Permission, Admin>`), `AdminContextSource`
- Server: `getAdmin()` (per-request cached; null if not signed in), `getAdminContext({ source })` (builds the `CapabilityContext` for the signed-in admin; redirects to `/admin/sign-in` without one), `requirePermission(permission)` (returns `{ admin, client }`; redirects to sign-in or calls `forbidden()`)
- Planned, not built yet: `signInAction`, `signOutAction` and `SignInForm` (sign-in item); `getAdminContextForAdmin(adminId, source)` (messaging item: the bot has no user session, so it needs a service-role permission lookup); `inviteAdminAction`, `changeRoleAction`, `archiveAdminAction`, `TeamManager` (team management); `AdminShell`.

## Layout

- SQL: `supabase/schemas/10_access/` (enums `admin_role`, `permission`; `admins`; `role_permissions`, `has_permission`, `my_permissions`, `guard_active_owner`). pgTAP: `supabase/tests/access.test.sql`.
- `server/session/`: `session.loader.ts` verifies with `auth.getUser()`, then reads the admin and SQL permissions; `session.service.ts` caches per request and exposes guards. Types, sign-in path constants and matching tests are colocated.
- `server/context/`: `context.factory.ts` builds capability contexts; `context.types.ts` owns context and input-option contracts.
- `server/admin/`: `admin.repository.ts` owns database queries; `admin.schema.ts` parses rows and permissions against generated enums; `admin.types.ts` owns admin/role/permission types. This is access's role-suffixed implementation of the feature repository convention.
- Each purpose group has an explicit `index.ts`. Other features still import only `features/access`; repositories stay internal. Keep orchestration functions linear, with no extra wrapper classes for session or context entry points.

## Invariants

- The permission matrix lives **only** in SQL (`private.role_permissions`). TS reads it through `access.my_permissions()`; never duplicate it.
- Every admin query starts with `requirePermission`; every admin Server Action starts with `getAdminContext` and runs a capability, which checks the permission. `proxy.ts` redirects are only a UX convenience.
- Session policy: 1 h access token, refresh rotation, 7-day absolute limit, 24 h inactivity timeout (Q-05). Enforced here if the Supabase plan doesn't.
- At least one non-archived `owner` must always exist: `private.guard_active_owner` triggers raise `owner_required` (P0001), and the first admin of an empty roster must be an owner. Admins are archived, never deleted; `auth.users` deletes are restricted.
- `authenticated` may only `select` admins (own active row, or all with `admins.manage`). Roster writes use the service role until team management adds entry points.
- An archived admin has no permissions, even with a valid session.

## Dependencies

`src/integrations/supabase` (server client, generated types), `shared/lib/capability`.

## Testing

- pgTAP: permission map per role; `has_permission` false for archived admins and anonymous users; last-owner guard.
- Unit: guards and context builder with `next/navigation` and the session loader mocked; a staff context is refused `catalog.manage` by a capability.
- Integration: `loadAdminSession` against local Supabase (staff permissions, archived, non-admin, signed out). Needs `.env.local` with the local stack's URL and keys.
- e2e: sign-in, sign-out, session expiry redirect.

## Gotchas

- `getAdmin()` uses React `cache`; don't pass the admin object to client components, pass only the fields they need.
- MFA for owners is open question O-3.
- Session limits rely on Supabase Auth `[auth.sessions]` (Q-05); production needs a plan with them (O-5) or DAL checks.
- Server Components can't write cookies, so a refreshed token is lost there. Before any admin page ships, `proxy.ts` must refresh the session on `/admin` (or refresh-token reuse detection will sign admins out).
- `ADMIN_SIGN_IN_PATH` is cast to `Route` until the sign-in page exists; drop the cast when it does.
- Adding a permission: add the enum value in its own migration, update `private.role_permissions`, regenerate types, extend the pgTAP matrix.
