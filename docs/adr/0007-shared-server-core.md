# 0007. Keep server boundaries independent of feature types

- **Status:** proposed
- **Date:** 2026-10-25
- **Approver:** Alejandro Loaiza

## Context

AG-05/AG-06 require Result failures and structured diagnostics. Shared capabilities must authorize and parse for both admin web and messaging without importing access or generated database types.

## Decision

Use `CapabilityContext<Client, Permission, Admin>` with a SQL-supplied `ReadonlySet<Permission>`. Callers annotate the execute context; the runner authorizes before async Zod parsing and passes parsed output to execute. Bugs propagate to the action/job boundary.

Keep the logger transport private and server-only. Callers select flat safe diagnostic fields; common sensitive keys, URLs and contact patterns receive defensive redaction. Unexpected action failures log stack frames, omitting messages and arbitrary payloads that may contain secrets. Next signals propagate through `unstable_rethrow`; finish and duration are always logged.

Keep descriptive generic names and separate contracts (`*.types.ts`) and named values (`*.constants.ts`) from behavior. Typed constant objects preserve existing string unions. Focused static helpers (`Results`, `Mask`, `LogSanitizer`, `ErrorDiagnostics`) make call sites discoverable; operation entry points remain functions. Existing imports and helper aliases remain compatible.

## Alternatives considered

- Import feature types into shared — violates enforced boundaries.
- Duplicate a permission matrix in TypeScript — risks diverging from SQL.
- Log entire errors or request objects — may disclose credentials or customer data.

## Consequences

Features keep concrete client/admin typing without shared knowing their models. Context construction remains a trusted server responsibility. Logs retain call locations but omit exception messages; callers must still avoid sensitive data because redaction cannot recognize arbitrary secrets.
