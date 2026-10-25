-- One row per Supabase Auth user allowed into the admin panel. Archived, never deleted (DB-07).
create table access.admins (
  user_id uuid not null,
  display_name text not null,
  role access.admin_role not null default 'staff',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint admins_pkey primary key (user_id),

  constraint admins_user_id_fkey foreign key (user_id)
    references auth.users (id)
    on delete restrict,

  constraint admins_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint admins_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint admins_display_name_check check (
    char_length(display_name) between 1 and 80
  )
);

create index admins_created_by_idx on access.admins (created_by);

create index admins_updated_by_idx on access.admins (updated_by);

create trigger admins_set_updated_at
before update on access.admins
for each row
execute function private.set_updated_at();
