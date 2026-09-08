# Snackyzz Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a responsive store with persistent SINPE orders, administrator review and configurable email confirmation.

**Architecture:** Existing vanilla JavaScript modules plus a Flask API with SQLite and private image storage. Public UI and admin call the same origin API. Integration boundaries are defined in the spec.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Python 3.9+, Flask, SQLite, Pillow, SMTP, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-07-snackyzz-store-design.md`

## Global Constraints

- Preserve palette #F9EDE0, #3C1907, #ED781A, #D95907.
- Three clearly labeled demo products until real data exists; never invent real locations or payment details.
- Server persists a valid receipt before reporting success; administrator confirms and triggers email.
- Responsive mobile/tablet/desktop, keyboard access, readable contrast and reduced motion.
- Keep credentials, order data and uploaded receipts out of Git and public routes.

### Task 1: API and persistence

Ownership: worker, `server/`, `tests/test_api.py`, `requirements.txt`, `.env.example`, `data/catalog.json`.

- [ ] Add Flask client tests demonstrating required receipt and authoritative totals fail before implementing the service.
- [ ] Implement the API contract in the spec with modules for storage, validation, auth, email and routes; immutable price snapshots, transactions, private receipt files, CSRF and session limits.
- [ ] Test order creation, repeat submissions, private routes, confirmation and retry with a captured mail transport; no actual external messages.
- [ ] Run `python3 -m unittest discover -s tests -p 'test_*.py'` using the project environment. Report integration contract and configuration precisely.

### Task 2: Storefront and administration

Ownership: parent, `src/`, `index.html`, `package.json`, `tests/*.test.js`.

- [ ] Replace old style/copy tests with behavioral tests for cart restoration, bounded integer quantities and unknown products; run `npx -y node@20 --test tests/*.test.js` and observe the missing behavior.
- [ ] Implement shared escaping, API error handling, accessible controls and route transitions. Keep checkout draft/files intact on failures.
- [ ] Implement home, shop, product dialog, responsive cart, receipt checkout and server-confirmed success.
- [ ] Implement genuine locations/empty state and protected admin login, order filters/details, receipt viewing and confirmation/retry feedback.
- [ ] Exercise these through the running server at desktop and mobile sizes and an end-to-end test order.

### Task 3: Assets

Ownership: asset producer, `assets/` only.

- [ ] Produce a studio cookie hero and three product images that match the orange/cream world, with exact generation prompts and provenance.
- [ ] Use web-friendly output sizes, self-host available characterful typography and preserve licensing. Images are illustrative and never presented as real product proof.

### Task 4: Review and delivery

Ownership: parent plus required independent reviewers/documenter.

- [ ] Review API and frontend behavior; fix material findings and rerun affected tests.
- [ ] Capture valid desktop/mobile screenshots, run Impeccable detector once, get independent finish review and resolve material findings.
- [ ] Record actual design system and update README with installation, run/test commands, environment configuration and production limitations.
- [ ] Initialize isolated build branch and associate the supplied GitHub remote; inspect staged files for private data before any commit. Publishing remains a distinct action.
