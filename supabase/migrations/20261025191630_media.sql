set local check_function_bodies = off;

create schema "media";

create table "media"."files" (
  "bucket"      text                     not null,
  "object_path" text                     not null,
  "mime_type"   text                     not null,
  "size_bytes"  integer                  not null,
  "width"       integer,
  "height"      integer,
  "sha256"      text                     not null,
  "uploaded_by" uuid,
  "created_at"  timestamp with time zone not null default now(),
  constraint "files_bucket_object_path_key" unique (bucket, object_path),
  "id"          uuid                     not null default private.uuid_v7(),
  constraint "files_pkey" primary key (id)
);

alter table "media"."files"
  enable row level security;

create table "private"."rate_limits" (
  "key"               text                     not null,
  "window_started_at" timestamp with time zone not null default now(),
  "requests"          integer                  not null default 1,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "rate_limits_pkey" primary key (key)
);

alter table "private"."rate_limits"
  enable row level security;

create type "media"."file_purpose" as enum (
  'payment_proof',
  'refund_proof',
  'product_image',
  'brand_logo',
  'message_attachment'
);

alter table "media"."files"
  add column "purpose" media.file_purpose not null;

create or replace function private.consume_rate_limit (
  rate_key       text,
  max_requests   integer,
  window_seconds integer
)
  returns boolean
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
declare
  -- clock_timestamp, not now(): now() is the transaction start, stale after waiting on the row lock.
  request_time timestamptz := clock_timestamp();
  window_cutoff timestamptz;
  admitted boolean;
begin
  if rate_key is null or char_length(rate_key) not between 1 and 128
    or max_requests is null or max_requests < 1
    or window_seconds is null or window_seconds < 1
  then
    raise exception 'invalid_rate_limit';
  end if;

  window_cutoff := request_time - make_interval(secs => window_seconds);

  insert into private.rate_limits as limits (key, window_started_at, requests)
  values (rate_key, request_time, 1)
  on conflict (key) do update
  set requests = case
        when limits.window_started_at <= window_cutoff then 1
        else limits.requests + 1
      end,
      window_started_at = case
        when limits.window_started_at <= window_cutoff then request_time
        else limits.window_started_at
      end,
      updated_at = request_time
  where limits.window_started_at <= window_cutoff
    or limits.requests < max_requests
  returning true into admitted;

  return coalesce(admitted, false);
end;
$function$;

create or replace function public.consume_rate_limit (
  rate_key       text,
  max_requests   integer,
  window_seconds integer
)
  returns boolean
  language sql
  set search_path to ''
  AS $function$
  select private.consume_rate_limit(rate_key, max_requests, window_seconds);
$function$;

revoke all
  on function "public"."consume_rate_limit"(text, integer, integer)
  from public, "anon", "authenticated";

alter table "media"."files"
  add constraint "files_uploaded_by_fkey" foreign key (uploaded_by)
    references access.admins(user_id);

create index files_uploaded_by_idx on media.files using btree (uploaded_by);

create policy "files_catalog_read" on "media"."files"
  for select
  to "anon", "authenticated"
  using
    ((purpose = ANY (ARRAY['product_image'::media.file_purpose, 'brand_logo'::media.file_purpose])));

create policy "files_proof_read" on "media"."files"
  for select
  to "authenticated"
  using
    (((purpose = ANY (ARRAY['payment_proof'::media.file_purpose,
    'refund_proof'::media.file_purpose])) AND
    ( select private.has_permission('orders.view'::access.permission) as has_permission)));

create policy "media_catalog_read" on "storage"."objects"
  for select
  to "anon", "authenticated"
  using ((bucket_id = 'catalog-images'::text));

create policy "media_proof_read" on "storage"."objects"
  for select
  to "authenticated"
  using
    (((bucket_id = ANY (ARRAY['payment-proofs'::text, 'refund-proofs'::text])) AND ( select
    private.has_permission('orders.view'::access.permission) as has_permission)));

revoke all on function "private"."consume_rate_limit"(text, integer, integer) from public;

grant execute on function "private"."consume_rate_limit"(text, integer, integer) to "service_role";

revoke all on function "public"."consume_rate_limit"(text, integer, integer) from "postgres";

grant execute on function "public"."consume_rate_limit"(text, integer, integer) to "postgres";

grant execute on function "public"."consume_rate_limit"(text, integer, integer) to "service_role";

grant usage on schema "media" to "anon", "authenticated", "service_role";

grant select on table "media"."files" to "anon", "authenticated";

grant delete, insert, select on table "media"."files" to "service_role";
