# features/access

## Purpose

Who can use the admin panel and what they may do: sign-in, sessions, the admin roster, roles (`owner`, `staff`) and permissions.

## Owns / does not own

- **Owns:** schema `access` (admins), `private.role_permissions` / `private.has_permission`, `access.my_permissions()`, the sign-in page and the admin Team page.
- **Does not own:** Supabase Auth itself (`src/integrations/supabase`) or per-feature RLS policies (each feature's schema files call `private.has_permission`).

## Public API (`index.ts`)

- Types: `Admin` (`id`, `displayName`, `role`), `AdminRole`, `Permission` (from the generated `access` enums), `AdminContext` (`CapabilityContext<DatabaseClient, Permission, Admin>`), `AdminContextSource`
- Server: `getAdmin()` (per-request cached; null if not signed in), `getAdminContext({ source })` (builds the `CapabilityContext` for the signed-in admin; redirects to `/admin/sign-in` without one), `requirePermission(permission)` (returns `{ admin, client }`; redirects to sign-in or calls `forbidden()`)
- Paths: `ADMIN_SIGN_IN_PATH` (`/admin/sign-in`), `ADMIN_HOME_PATH` (`/admin`, where sign-in lands)
- Proxy: `refreshAdminSession(request)`, called only by `src/proxy.ts` on `/admin/**`
- Server Actions: `signInAction(input)` (redirects to `ADMIN_HOME_PATH`; otherwise `invalid_credentials`, `too_many_attempts`, `invalid_input` or `unexpected`), `signOutAction()` (local scope; redirects to sign-in, or returns `sign_out_failed`)
- UI: `AdminHeader({ actions?, activeSection? })` (wordmark bar; with `activeSection` it shows the section tabs, `AdminSection.Orders` → `/admin` and `AdminSection.Catalog` → `/admin/catalog`, the open one underlined with `aria-current`; names the section when signed out), `AdminSection` / `AdminSectionValue`, `SignInWelcome`, `SignInForm` (client, `useSignInForm`), `SignOutButton` (client, `useSignOutButton`)
- Planned, not built yet: `getAdminContextForAdmin(adminId, source)` (messaging item: the bot has no user session, so it needs a service-role permission lookup); `inviteAdminAction`, `changeRoleAction`, `archiveAdminAction`, `TeamManager` (team management); `AdminShell` (grows from `AdminHeader`, which already holds the section tabs); a Configuración tab once settings has a route.

## Layout

- SQL: `supabase/schemas/10_access/` (enums `admin_role`, `permission`; `admins`; `role_permissions`, `has_permission`, `my_permissions`, `guard_active_owner`). pgTAP: `supabase/tests/access.test.sql`.
- `domain/sign-in/`: the client-safe `signInInputSchema` (issue messages are `SignInFieldError` codes) and its types. `domain/errors/`: `AccessError` codes; copy in `errors.access`.
- `server/session/`: `session.loader.ts` verifies with `auth.getUser()`, then reads the admin and SQL permissions; `session.service.ts` caches per request and exposes guards; `session-refresh.runner.ts` refreshes cookies for `proxy.ts`. Types, path constants and matching tests are colocated.
- `server/sign-in/`, `server/sign-out/`: `*.actions.ts` Server Actions wrapped in `runAction`. They manage the session itself, so they are not capabilities.
- `hooks/` and `ui/` by purpose: `sign-in/` (`useSignInForm` ↔ `SignInForm`, `SignInWelcome`), `sign-out/` (`useSignOutButton` ↔ `SignOutButton`), `admin-header/`. Both hooks return `useFormAction({ … })` (codes); `SignInForm` and `SignOutButton` translate with `useErrorMessage("access")`; sign-in is the reference implementation of [Forms and Server Actions](../../../docs/code-conventions.md#forms-and-server-actions) (it preserves only `email`).
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
- Sign-in answers a wrong password, a non-admin and an archived admin with the same `invalid_credentials`, and signs non-admins straight back out, so the form can't reveal who is an admin. Logs carry only `Mask.email` output.
- Sign-out uses `scope: "local"`: only this device's session ends.

## Dependencies

`src/integrations/supabase` (server and proxy clients, generated types), `shared/lib/capability`.

## Testing

- pgTAP: permission map per role; `has_permission` false for archived admins and anonymous users; last-owner guard.
- Unit: guards and context builder with `next/navigation` and the session loader mocked; a staff context is refused `catalog.manage` by a capability; `signInInputSchema`; `useSignInForm` and `useSignOutButton` with `renderHook` and the actions mocked (codes); `SignInForm` and `SignOutButton` with their hooks mocked (translated, linked errors); `refreshAdminSession` redirects with the proxy client mocked.
- Integration (needs `.env.local` with the local stack's URL and keys): `loadAdminSession` (staff permissions, archived, non-admin, signed out); `sign-in.actions.int.test.ts` runs both actions with an in-memory cookie jar (seeded admin, wrong password, non-admin, archived, sign-out).
- e2e: `tests/e2e/admin-sign-in.spec.ts` (no-session redirect, wrong password, sign-in → sign-out).

## Gotchas

- `getAdmin()` uses React `cache`; don't pass the admin object to client components, pass only the fields they need.
- MFA for owners is open question O-3.
- Session limits rely on Supabase Auth `[auth.sessions]` (Q-05); production needs a plan with them (O-5) or DAL checks.
- Server Components can't write cookies, so a refreshed token is lost there. `proxy.ts` refreshes the session on every `/admin/**` request; keep new admin routes under `/admin` or refresh-token reuse detection will sign admins out.
- The proxy reads the session with `getSession()` (cookie only, refreshes an expired token) because it also runs for prefetches; it redirects only signed-out `GET`s. Authorization stays in the DAL (`getUser()`).
- `getAdminSession` calls `connection()` first: the expiry check reads the clock, which Cache Components refuses to prerender. Read the session inside a `<Suspense>` boundary.
- `next.config.ts` sets `logging.serverFunctions: false`; dev logs would otherwise print sign-in passwords.
- Local Auth allows 30 sign-ins per 5 minutes per IP (`[auth.rate_limit]`); rapid e2e reruns can hit `too_many_attempts`.
- `/admin` is a placeholder greeting until the orders item replaces it; its tab is already labelled Órdenes.
- Section tabs are links in `ui/admin-header/admin-sections.constants.ts`. They show every section to every admin (as `main` did); staff who open Productos get the 403 page.
- Adding a permission: add the enum value in its own migration, update `private.role_permissions`, regenerate types, extend the pgTAP matrix.
