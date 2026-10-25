# features/access

## Purpose

Who can use the admin panel and what they may do: sign-in, sessions, the admin roster, roles (`owner`, `staff`) and permissions.

## Owns / does not own

- **Owns:** schema `access` (admins), `private.role_permissions` / `private.has_permission`, `access.my_permissions()`, the sign-in page and the admin Team page.
- **Does not own:** Supabase Auth itself (`src/integrations/supabase`) or per-feature RLS policies (each feature's schema files call `private.has_permission`).

## Public API (`index.ts`)

- Types: `Admin`, `AdminRole`, `Permission`
- Server: `getAdmin()` (per-request cached; null if not signed in), `getAdminContext({ source })` (builds the `CapabilityContext` for the signed-in admin), `getAdminContextForAdmin(adminId, source)` (same, for the Telegram bot after `messaging` resolved the sender; returns null for archived admins), `requirePermission(permission)` (returns `{ admin, client }` or redirects/throws), `signInAction`, `signOutAction`, `inviteAdminAction`, `changeRoleAction`, `archiveAdminAction`
- UI: `SignInForm`, `TeamManager`, `AdminShell` (nav filtered by permissions)

## Invariants

- The permission matrix lives **only** in SQL (`private.role_permissions`). TS reads it through `access.my_permissions()`; never duplicate it.
- Every admin query starts with `requirePermission`; every admin Server Action starts with `getAdminContext` and runs a capability, which checks the permission. `proxy.ts` redirects are only a UX convenience.
- Session policy: 1 h access token, refresh rotation, 7-day absolute limit, 24 h inactivity timeout (Q-05). Enforced here if the Supabase plan doesn't.
- At least one non-archived `owner` must always exist (checked in SQL).
- An archived admin has no permissions, even with a valid session.

## Dependencies

`src/integrations/supabase` (server client), `shared/config`.

## Testing

- pgTAP: permission map per role; `has_permission` false for archived admins and anonymous users; last-owner guard.
- Integration: `requirePermission` denies staff on `catalog.manage`.
- e2e: sign-in, sign-out, session expiry redirect.

## Gotchas

- `getAdmin()` uses React `cache`; don't pass the admin object to client components, pass only the fields they need.
- MFA for owners is open question O-3.
