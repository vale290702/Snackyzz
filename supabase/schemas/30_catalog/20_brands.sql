-- Snackyzz and its collab brands. Brand copy is data, never code (DOM-01).
create table catalog.brands (
  id uuid not null default private.uuid_v7(),
  slug text not null,
  name text not null,
  tagline text,
  description text,
  label text,
  is_primary boolean not null default false,
  logo_file_id uuid,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint brands_pkey primary key (id),

  constraint brands_slug_key unique (slug),

  constraint brands_logo_file_id_fkey foreign key (logo_file_id)
    references media.files (id),

  constraint brands_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint brands_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint brands_slug_check check (
    char_length(slug) between 1 and 60
    and slug ~ '^[a-z0-9-]+$'
  ),

  constraint brands_name_check check (
    char_length(name) between 1 and 80
  ),

  constraint brands_tagline_check check (
    char_length(tagline) between 1 and 160
  ),

  constraint brands_description_check check (
    char_length(description) between 1 and 1000
  ),

  constraint brands_label_check check (
    char_length(label) between 1 and 80
  ),

  constraint brands_sort_order_check check (
    sort_order >= 0
  ),

  -- The primary brand is the storefront's home; it can't disappear from it.
  constraint brands_primary_not_archived_check check (
    not (is_primary and archived_at is not null)
  )
);

-- At most one primary brand; private.guard_primary_brand makes it exactly one.
create unique index brands_is_primary_key on catalog.brands (is_primary)
where is_primary;

create index brands_logo_file_id_idx on catalog.brands (logo_file_id);

create index brands_created_by_idx on catalog.brands (created_by);

create index brands_updated_by_idx on catalog.brands (updated_by);

create trigger brands_set_updated_at
before update on catalog.brands
for each row
execute function private.set_updated_at();
