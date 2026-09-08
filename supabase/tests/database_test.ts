// Executes the migration in actual PostgreSQL (WASM/PGlite). Auth/Storage service
// tables are minimal fixtures, so these tests do not replace hosted integration.
import { PGlite } from "npm:@electric-sql/pglite@0.3.7";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function rejected(fn: () => Promise<unknown>, message: string) {
  let failed = false;
  try {
    await fn();
  } catch {
    failed = true;
  }
  assert(failed, message);
}
Deno.test(
  "PostgreSQL migration: transactions, authoritative prices, RLS and email claims",
  async () => {
    const db = new PGlite();
    try {
      await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
      $$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
      grant select on storage.objects to authenticated;
    `);
      const migration = await Deno.readTextFile(
        new URL("../migrations/202609080001_snackyzz.sql", import.meta.url),
      );
      await db.exec(migration);
      const { rows: seed } = await db.query<{ count: number }>(
        "select count(*)::integer count from public.products",
      );
      assert(seed[0].count === 3, "Three initial products required");
      await db.exec(
        "insert into public.sales_points(name,city,address) values('Punto de prueba','San José','Dirección de prueba')",
      );
      const { rows: locations } = await db.query<{ city: string }>(
        "select city from public.sales_points",
      );
      assert(
        locations[0].city === "San José",
        "Locations require the city used by storefront filters",
      );
      await db.exec(
        `insert into storage.objects(bucket_id,name) values('receipts','11111111-1111-1111-1111-111111111111.jpg')`,
      );
      const create = (
        items: unknown = [{ productId: "choco-cloud", quantity: 2, price: 1 }],
        key = "request-key-1",
        hash = "a".repeat(64),
      ) =>
        db.query<{
          value: {
            order: { id: string; total: number; status: string };
            reused: boolean;
          };
        }>("select public.create_order($1,$2,$3,$4,$5,$6::jsonb,$7) value", [
          key,
          hash,
          "Ana Ejemplo",
          "ana@example.test",
          "",
          JSON.stringify(items),
          "11111111-1111-1111-1111-111111111111.jpg",
        ]);
      for (const quantity of [0, -1, 1.5, true, "2", 100, null]) {
        await rejected(
          () => create([{ productId: "choco-cloud", quantity }]),
          "Invalid quantity must reject",
        );
      }
      await rejected(
        () => create([{ productId: "missing", quantity: 1 }]),
        "Unknown product must reject",
      );
      await db.exec(
        "update public.store_settings set demo_catalog=false where id=1",
      );
      await rejected(
        () => create(undefined, "blocked-payment"),
        "Real orders require configured SINPE",
      );
      await db.exec(
        "update public.store_settings set demo_catalog=true where id=1",
      );
      const first = (await create()).rows[0].value;
      assert(
        first.order.total === 5000 && first.order.status === "pending",
        "Server must calculate trusted prices",
      );
      const repeated = (await create()).rows[0].value;
      assert(
        repeated.reused && repeated.order.id === first.order.id,
        "Duplicate must return same persisted order",
      );
      await rejected(
        () => create(undefined, "request-key-1", "b".repeat(64)),
        "Changed payload must conflict",
      );
      await db.exec(`set role anon`);
      assert(
        (await db.query("select * from public.products")).rows.length === 3,
        "Anonymous catalog read",
      );
      await rejected(
        () => db.query("select * from public.orders"),
        "Anonymous order access must fail",
      );
      await rejected(() => create(), "Anonymous RPC create bypass must fail");
      await db.exec("reset role; set role authenticated");
      assert(
        (await db.query("select * from public.orders")).rows.length === 0,
        "Non-admin order rows hidden by RLS",
      );
      await rejected(
        () =>
          db.exec(
            "insert into public.admin_users(user_id) values('22222222-2222-2222-2222-222222222222')",
          ),
        "Self-promotion denied",
      );
      await rejected(
        () =>
          db.query("select public.claim_confirmation($1)", [first.order.id]),
        "Non-service confirmation RPC denied",
      );
      await db.exec(`reset role;
      insert into auth.users values('22222222-2222-2222-2222-222222222222');
      insert into public.admin_users values('22222222-2222-2222-2222-222222222222');
      set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222'; set role authenticated;`);
      assert(
        (await db.query("select * from public.orders")).rows.length === 1,
        "Admin order read allowed",
      );
      assert(
        (await db.query("select * from storage.objects")).rows.length === 1,
        "Admin receipt read allowed",
      );
      await db.exec("reset role");
      const claim = (
        await db.query<{ value: { claimed: boolean; claimToken: string } }>(
          "select public.claim_confirmation($1,false) value",
          [first.order.id],
        )
      ).rows[0].value;
      assert(claim.claimed, "First confirm must claim");
      const second = (
        await db.query<{ value: { claimed: boolean } }>(
          "select public.claim_confirmation($1,true) value",
          [first.order.id],
        )
      ).rows[0].value;
      assert(!second.claimed, "Active send claim prevents parallel retries");
      await db.query(
        "select public.finish_email($1,$2,'failed',null,'No provider configured')",
        [first.order.id, claim.claimToken],
      );
      const retry = (
        await db.query<{ value: { claimed: boolean; claimToken: string } }>(
          "select public.claim_confirmation($1,true) value",
          [first.order.id],
        )
      ).rows[0].value;
      assert(retry.claimed, "Failed delivery explicitly retryable");
      const payload = {
        from: "orders@example.test",
        to: ["ana@example.test"],
        subject: "confirmed",
        text: "hello",
      };
      await db.query("select public.prepare_email($1,$2,$3)", [
        first.order.id,
        retry.claimToken,
        JSON.stringify(payload),
      ]);
      await db.query(
        "select public.finish_email($1,$2,'sent','provider-1',null)",
        [first.order.id, retry.claimToken],
      );
      const sent = (
        await db.query<{ value: { claimed: boolean } }>(
          "select public.claim_confirmation($1,true) value",
          [first.order.id],
        )
      ).rows[0].value;
      assert(!sent.claimed, "Sent email cannot be sent twice");
      assert(
        (await db.query("select * from public.order_items")).rows.length === 1,
        "Failed orders leave no partial rows",
      );
    } finally {
      await db.close();
    }
  },
);
