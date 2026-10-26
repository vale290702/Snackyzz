-- Links are added and removed, never edited, so they carry created_* only.
create table catalog.product_categories (
  product_id uuid not null,
  category_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid,

  constraint product_categories_pkey primary key (product_id, category_id),

  constraint product_categories_product_id_fkey foreign key (product_id)
    references catalog.products (id),

  constraint product_categories_category_id_fkey foreign key (category_id)
    references catalog.categories (id),

  constraint product_categories_created_by_fkey foreign key (created_by)
    references access.admins (user_id)
);

create index product_categories_category_id_idx on catalog.product_categories (category_id);

create index product_categories_created_by_idx on catalog.product_categories (created_by);
