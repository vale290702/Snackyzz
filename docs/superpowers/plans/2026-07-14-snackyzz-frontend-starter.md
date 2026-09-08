# Snackyzz Frontend Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Snackyzz mockup into a maintainable web frontend starter.

**Architecture:** Keep the app as a dependency-free browser module SPA served by Python's static server. Split the single JavaScript file into data modules, small component renderers, page renderers, cart state, router helpers, and one app entrypoint.

**Tech Stack:** Vanilla JavaScript ES modules, CSS, Node test runner, Python static server.

---

## File Structure
- `src/data/products.js`: editable product catalog.
- `src/data/salesPoints.js`: editable sales point catalog.
- `src/components/ui.js`: shared UI render helpers.
- `src/pages/home.js`: home page renderer.
- `src/pages/shop.js`: shop page renderer.
- `src/pages/sales.js`: sales points page renderer.
- `src/pages/about.js`: about/info page renderer.
- `src/lib/cart.js`: cart state, totals, and localStorage persistence.
- `src/lib/router.js`: hash route parsing and route changes.
- `src/main.js`: app composition, event handling, and rendering.
- `tests/smoke.test.js`: structure, cart, and page smoke coverage.

## Tasks
- [ ] Add failing tests for the modular frontend structure and cart persistence.
- [ ] Extract catalog and sales point data into modules.
- [ ] Add cart and router libraries.
- [ ] Move page rendering into focused page modules.
- [ ] Replace `src/main.js` with the app shell and event handlers.
- [ ] Run tests and verify the local server still serves the app.
