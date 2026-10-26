-- Writes go through RLS (catalog.manage); price history is written only by its trigger.
revoke all on table catalog.brands from public, anon, authenticated, service_role;

revoke all on table catalog.categories from public, anon, authenticated, service_role;

revoke all on table catalog.products from public, anon, authenticated, service_role;

revoke all on table catalog.product_categories from public, anon, authenticated, service_role;

revoke all on table catalog.product_variants from public, anon, authenticated, service_role;

revoke all on table catalog.variant_price_history from public, anon, authenticated, service_role;

grant select on table catalog.brands to anon;

grant select on table catalog.categories to anon;

grant select on table catalog.products to anon;

grant select on table catalog.product_categories to anon;

grant select on table catalog.product_variants to anon;

grant select, insert, update on table catalog.brands to authenticated, service_role;

grant select, insert, update on table catalog.categories to authenticated, service_role;

grant select, insert, update on table catalog.products to authenticated, service_role;

grant select, insert, delete on table catalog.product_categories to authenticated, service_role;

grant select, insert, update on table catalog.product_variants to authenticated, service_role;

grant select on table catalog.variant_price_history to authenticated, service_role;
