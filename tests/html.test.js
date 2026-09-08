import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, safeImage } from "../src/lib/html.js";
import { getRouteFromHash } from "../src/lib/router.js";
import { renderAdmin } from "../src/pages/admin.js";
test("customer/catalog content is escaped before insertion into HTML", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="x">&\''),
    "&lt;img src=x onerror=&quot;x&quot;&gt;&amp;&#39;",
  );
});
test("image sources accept only project assets", () => {
  assert.equal(safeImage("javascript:alert(1)"), "/assets/choco-cloud.webp");
  assert.equal(
    safeImage("/assets/double-choco.webp"),
    "/assets/double-choco.webp",
  );
});
test("known routes include checkout/admin and unknown hashes recover home", () => {
  for (const route of ["checkout", "admin", "sales", "success"])
    assert.equal(getRouteFromHash("#" + route), route);
  assert.equal(getRouteFromHash("#unknown"), "home");
});
test("admin exposes a safe retry for a confirmed email left sending", () => {
  const markup = renderAdmin({
    authenticated: true,
    loading: false,
    busy: false,
    error: "",
    filter: "confirmed",
    search: "",
    selected: "order-1",
    orders: [
      {
        id: "order-1",
        name: "Cliente",
        email: "client@example.invalid",
        phone: "",
        items: [],
        total: 2500,
        status: "confirmed",
        createdAt: "2026-09-07T15:00:00Z",
        confirmedAt: "2026-09-07T15:10:00Z",
        emailStatus: "sending",
        receiptUrl: "/assets/choco-cloud.webp",
      },
    ],
  });
  assert.match(markup, /data-retry-email="order-1"/);
  assert.match(markup, /bloqueo de seguridad/);
});
