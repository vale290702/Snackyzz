# 0008. Type permissions in SQL and resolve admin sessions server-side

- **Status:** proposed
- **Date:** 2026-10-25
- **Approver:** Alejandro Loaiza
- **Refs:** DOM-13, DB-05, DB-16, Q-05, O-3, O-5, [0007](0007-shared-server-core.md)

## Context

Every RLS policy, capability and admin page depends on `access`. The ER design sketched `private.has_permission(text)`, but a misspelled text permission in a policy denies silently, and TypeScript would need a hand-written `Permission` union. "At least one active owner" must hold under concurrent edits. Capabilities need a trusted context whose permissions come from SQL (ADR 0007).

## Decision

- Permissions are a Postgres enum, `access.permission`; roles stay `access.admin_role`. `private.role_permissions(role)` (immutable) is the only role → permission map. `private.has_permission(access.permission)` and `access.my_permissions()` are stable security definer functions keyed on `(select auth.uid())` and ignore archived admins. A misspelled permission literal fails when the policy is created, and TS takes `Permission` from the generated types.
- Before-row triggers on `access.admins` run `private.guard_active_owner()`, which locks the other active owners `for update` and raises `owner_required` when an insert, update or delete would leave none. The first admin of an empty roster must be an owner. `auth.users` deletes are restricted; admins are archived.
- `authenticated` gets `select` only (own active row; whole roster with `admins.manage`). Roster writes stay service-role-only until team management adds its entry points.
- `access/server` resolves the session with `auth.getUser()` (verified by Supabase Auth on every request, so signed-out sessions stop working immediately) and reads permissions through `access.my_permissions()`, cached per request with React `cache`. `getAdminContext` builds `CapabilityContext<DatabaseClient, Permission, Admin>`; `requirePermission` redirects to sign-in or calls `forbidden()` (enables `experimental.authInterrupts`).
- Session limits (Q-05) come from Supabase Auth (`[auth.sessions]` in `config.toml`). Production needs a plan that includes them (O-5); otherwise the DAL must add checks.

## Alternatives considered

- **`has_permission(text)` as sketched** — typos deny silently and TS duplicates the permission list.
- **Last-owner check only in future team-management entry points** — direct service-role or SQL edits could still remove every owner.
- **`getClaims()`** — no Auth round trip, but a signed-out access token keeps working for up to an hour.
- **`notFound()` for missing permissions** — stable API, but hides the real reason from staff.

## Consequences

Adding a permission means a migration that adds the enum value (on its own), updates `role_permissions` and regenerates types. Each admin request costs one Auth call plus two small queries. Sign-in/out actions, the session-refreshing `proxy.ts`, the Telegram context builder (`getAdminContextForAdmin`) and team management are follow-ups.
