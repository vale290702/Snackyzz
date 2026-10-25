-- Brands, categories, products and variants (features/catalog). Exposed through the Data API with RLS.
create schema if not exists catalog;

revoke all on schema catalog from public;

grant usage on schema catalog to anon, authenticated, service_role;
