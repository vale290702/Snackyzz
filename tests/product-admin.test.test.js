import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("product administration has an isolated function and storage migration", () => {
  const config = fs.readFileSync("supabase/config.toml", "utf8");
  const migration = fs.readFileSync(
    "supabase/migrations/202609090001_product_management.sql",
    "utf8",
  );
  const handler = fs.readFileSync(
    "supabase/functions/manage-products/index.ts",
    "utf8",
  );
  assert.match(config, /\[functions\.manage-products\]/);
  assert.match(migration, /product-images/);
  assert.match(handler, /archive/);
  assert.match(handler, /auth\.getUser/);
});
