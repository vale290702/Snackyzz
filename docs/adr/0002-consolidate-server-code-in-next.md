# 0002. Run all server code in Next.js; remove Supabase Edge Functions

- **Status:** accepted
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** ARC-05, ARC-06

## Context

Seven Deno Edge Functions plus a Next API route meant two runtimes, two toolchains and duplicated validation and types.

## Decision

Server Actions for UI mutations, Route Handlers for webhooks (`/api/webhooks/[channel]`) and jobs (`/api/jobs/[job]`). Supabase provides Postgres, Auth, Storage and `pg_cron` + `pg_net` to trigger jobs.

## Alternatives considered

- **Keep Edge Functions** — runtime split remains; shared code needs a second import map.
- **Vercel Cron** — limited schedules on lower plans; `pg_cron` keeps schedules next to the data.

## Consequences

One language toolchain, shared Zod schemas and types. Job endpoints must be secured with a shared secret and be idempotent.
