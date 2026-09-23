# Fulfillment and Store Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed store settings and pickup locations, capture pickup or Uber delivery on every order, and expose WhatsApp coordination after checkout.

**Architecture:** Extend the Supabase schema and transactional order RPCs with validated fulfillment snapshots. Add one authenticated `manage-store` Edge Function and consume its normalized data through the existing API/controller/rendering boundaries.

**Tech Stack:** Vanilla JavaScript, Vite, Supabase PostgreSQL/Auth/Storage/Edge Functions, Deno tests, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-fulfillment-store-settings-design.md`

## Global Constraints

- Public reads expose active pickup locations and non-secret store settings only.
- Resend credentials remain Supabase secrets and never enter admin-editable fields.
- Uber delivery cost is paid separately by the customer.
- All interface copy is Spanish and responsive.
- Existing local work remains unpushed until testing is complete.

---

### Task 1: Persist store configuration and fulfillment

**Files:**
- Create: `supabase/migrations/202609090002_fulfillment_settings.sql`
- Modify: `supabase/functions/create-order/index.ts`
- Modify: `supabase/tests/database_test.ts`

**Interfaces:**
- Consumes: checkout multipart fields `fulfillmentType`, `pickupLocationId`, `deliveryAddress`.
- Produces: order snapshots with `fulfillmentType`, `fulfillmentLabel`, and `fulfillmentAddress`.

- [ ] Add failing database assertions for settings, active locations, and order fulfillment snapshots.
- [ ] Run `deno task test` from `supabase/functions` and confirm the new assertions fail.
- [ ] Add constrained columns, public-read policy updates, and RPC validation/snapshot logic.
- [ ] Parse and pass fulfillment fields from `create-order`.
- [ ] Run the Supabase checks and confirm they pass.

### Task 2: Add the authenticated store-management API

**Files:**
- Create: `supabase/functions/manage-store/index.ts`
- Create: `supabase/functions/manage-store/index_test.ts`
- Modify: `supabase/config.toml`
- Modify: `src/lib/api.js`

**Interfaces:**
- Produces: `GET /admin/store`, `POST /admin/store/settings`, and location save/archive/restore operations.

- [ ] Write failing handler tests for authorization and validated settings/location mutations.
- [ ] Implement the handler using the existing admin-membership check and service client.
- [ ] Add browser API adapter routes and Edge Function configuration.
- [ ] Run Deno and Node tests.

### Task 3: Build checkout fulfillment and WhatsApp flow

**Files:**
- Modify: `src/main.js`
- Modify: `src/pages/checkout.js`
- Modify: `src/components/ui.js`
- Modify: `src/styles.css`
- Modify: `tests/html.test.js`
- Modify: `tests/e2e/store.spec.js`

**Interfaces:**
- Consumes: active `salesPoints`, delivery settings, and WhatsApp.
- Produces: a validated multipart order request and WhatsApp success link.

- [ ] Add failing render and browser tests for pickup, Uber address, disclaimer, and WhatsApp.
- [ ] Add fulfillment state, validation, payload fields, cart summary, and success action.
- [ ] Add responsive styling and accessible form semantics.
- [ ] Run unit and Playwright tests.

### Task 4: Build the admin configuration interface

**Files:**
- Modify: `src/pages/admin.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `tests/product-admin.test.test.js`
- Modify: `tests/e2e/store.spec.js`

**Interfaces:**
- Consumes: store-management API responses.
- Produces: settings/location forms and fulfillment details in order review.

- [ ] Add failing controller and render tests for settings and location CRUD.
- [ ] Extend controller state/actions and add the Configuración tab.
- [ ] Render responsive settings and location editors, including email-provider guidance.
- [ ] Show fulfillment snapshots in order detail.
- [ ] Run unit and browser tests.

### Task 5: Deploy and verify without pushing Git

**Files:**
- Modify: `README.md`
- Modify: `supabase/README.md`

**Interfaces:**
- Deploys: migration plus `create-order`, `manage-orders`, and `manage-store` functions.

- [ ] Document admin fields and the exact Resend secret requirement.
- [ ] Run `npm test`, `npm run build`, `npm run test:e2e`, `deno task check`, and `deno task test`.
- [ ] Apply the migration and deploy functions to project `skncqvywmionhtfipixt`.
- [ ] Verify the live schema/function responses with the temporary admin account.
- [ ] Keep all Git changes local for user review.
