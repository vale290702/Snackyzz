-- Exact ER §4 record: files are immutable, with created_at only.
create table media.files (
  id uuid not null default private.uuid_v7(),
  bucket text not null,
  object_path text not null,
  purpose media.file_purpose not null,
  mime_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  sha256 text not null,
  uploaded_by uuid,
  created_at timestamptz not null default now(),

  constraint files_pkey primary key (id),
  constraint files_bucket_object_path_key unique (bucket, object_path),
  constraint files_uploaded_by_fkey foreign key (uploaded_by)
    references access.admins (user_id)
);

create index files_uploaded_by_idx on media.files (uploaded_by);

alter table media.files enable row level security;
