create table catalog.categories (
  id uuid not null default private.uuid_v7(),
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint categories_pkey primary key (id),

  constraint categories_slug_key unique (slug),

  constraint categories_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint categories_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint categories_slug_check check (
    char_length(slug) between 1 and 60
    and slug ~ '^[a-z0-9-]+$'
  ),

  constraint categories_name_check check (
    char_length(name) between 1 and 60
  ),

  constraint categories_sort_order_check check (
    sort_order >= 0
  )
);

create index categories_created_by_idx on catalog.categories (created_by);

create index categories_updated_by_idx on catalog.categories (updated_by);

create trigger categories_set_updated_at
before update on catalog.categories
for each row
execute function private.set_updated_at();
