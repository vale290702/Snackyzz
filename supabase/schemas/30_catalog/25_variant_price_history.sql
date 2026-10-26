-- Written only by the price triggers on product_variants (DB-17), never by application code.
-- Rows are immutable, so changed_at stands in for created_at and there is no updated_at.
create table catalog.variant_price_history (
  id uuid not null default private.uuid_v7(),
  variant_id uuid not null,
  price public.amount_crc not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),

  constraint variant_price_history_pkey primary key (id),

  constraint variant_price_history_variant_id_fkey foreign key (variant_id)
    references catalog.product_variants (id),

  constraint variant_price_history_changed_by_fkey foreign key (changed_by)
    references access.admins (user_id)
);

create index variant_price_history_variant_id_idx on catalog.variant_price_history (variant_id);

create index variant_price_history_changed_by_idx on catalog.variant_price_history (changed_by);
