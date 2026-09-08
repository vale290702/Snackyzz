-- Private order processing. Apply with Supabase CLI db push or SQL editor.
create table public.products (
  id text primary key, name text not null, price integer not null check (price > 0),
  description text not null, tag text not null, image text not null, accent text not null,
  position integer not null default 0, active boolean not null default true
);
create table public.sales_points (
  id uuid primary key default gen_random_uuid(), name text not null, city text not null,
  address text not null,
  hours text not null default '', map_url text not null default '', position integer not null default 0
);
create table public.store_settings (
  id integer primary key check(id = 1), demo_catalog boolean not null default true,
  sinpe_number text not null default '', sinpe_recipient text not null default ''
);
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (length(idempotency_key) between 8 and 128),
  fingerprint text not null,
  name text not null check(length(name) between 2 and 120),
  email text not null check(length(email) between 3 and 254),
  phone text not null default '' check(length(phone) <= 32),
  total integer not null check(total > 0),
  status text not null default 'pending' check(status in ('pending','confirmed')),
  created_at timestamptz not null default now(), confirmed_at timestamptz,
  receipt_path text not null unique
);
create table public.order_items (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id), name text not null,
  price integer not null check(price > 0), quantity integer not null check(quantity between 1 and 99),
  primary key(order_id,product_id)
);
create table public.email_outbox (
  order_id uuid primary key references public.orders(id),
  status text not null default 'pending' check(status in ('pending','sending','sent','failed','unknown')),
  attempts integer not null default 0, claim_token uuid,
  first_attempt_at timestamptz, claimed_at timestamptz, updated_at timestamptz not null default now(),
  payload jsonb, provider_id text, error text
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.products enable row level security;
alter table public.sales_points enable row level security;
alter table public.store_settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.email_outbox enable row level security;
-- Revoke Supabase's default table grants before granting only required access.
revoke all on public.products, public.sales_points, public.store_settings,
  public.admin_users, public.orders, public.order_items, public.email_outbox from anon, authenticated;
grant select on public.products, public.sales_points, public.store_settings to anon, authenticated;
grant select on public.admin_users, public.orders, public.order_items, public.email_outbox to authenticated;
grant all on public.products, public.sales_points, public.store_settings,
  public.admin_users, public.orders, public.order_items, public.email_outbox to service_role;
create policy catalog_read on public.products for select to anon,authenticated using(active);
create policy locations_read on public.sales_points for select to anon,authenticated using(true);
create policy settings_read on public.store_settings for select to anon,authenticated using(true);
create policy own_admin_membership on public.admin_users for select to authenticated using(user_id = (select auth.uid()));
create policy admin_orders_read on public.orders for select to authenticated using((select public.is_admin()));
create policy admin_items_read on public.order_items for select to authenticated using((select public.is_admin()));
create policy admin_mail_read on public.email_outbox for select to authenticated using((select public.is_admin()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,5242880,array['image/jpeg'])
on conflict(id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
create policy admin_receipt_read on storage.objects for select to authenticated
using(bucket_id='receipts' and (select public.is_admin()));
-- No customer INSERT/UPDATE/SELECT policies on receipts: Edge upload only.

insert into public.products(id,name,price,description,tag,image,accent,position) values
('choco-cloud','Choco Cloud',2500,'Una galleta de referencia con chispas de chocolate y un centro suave. Sabor y precio de muestra.','La clásica','/assets/choco-cloud.webp','#ED781A',1),
('double-choco','Double Choco',2800,'Una propuesta de cacao y chocolate para los antojos intensos. Sabor y precio de muestra.','Doble antojo','/assets/double-choco.webp','#3C1907',2),
('vanilla-crunch','Vanilla Crunch',2500,'Una propuesta de vainilla con bordes crujientes. Sabor y precio de muestra.','Un toque suave','/assets/vanilla-crunch.webp','#D95907',3);
insert into public.store_settings(id) values(1);

create function public.create_order(
  p_key text, p_fingerprint text, p_name text, p_email text, p_phone text,
  p_items jsonb, p_receipt_path text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.orders; v_order public.orders; v_item jsonb;
  v_product public.products; v_quantity integer; v_total integer := 0;
  v_snapshots jsonb := '[]'::jsonb; v_seen text[] := array[]::text[];
begin
  if p_key is null or p_fingerprint is null or p_key !~ '^[A-Za-z0-9_-]{8,128}$' or p_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid request key';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key,0));
  select * into v_existing from public.orders where idempotency_key=p_key;
  if found then
    if v_existing.fingerprint <> p_fingerprint then raise exception 'Idempotency conflict'; end if;
    return jsonb_build_object('order',jsonb_build_object('id',v_existing.id,'status',v_existing.status,
      'total',v_existing.total,'createdAt',v_existing.created_at),'reused',true);
  end if;
  if p_name is null or p_email is null or p_phone is null or length(trim(p_name)) not between 2 and 120
     or p_email !~ '^[^[:space:]@,<>]+@[^[:space:]@,<>]+\.[^[:space:]@,<>]+$'
     or length(p_email)>254 or length(p_phone)>32 then raise exception 'Invalid customer'; end if;
  if exists(select 1 from public.store_settings where id=1 and not demo_catalog
    and (sinpe_number='' or sinpe_recipient='')) then
    raise exception 'Payment is not configured';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 3 then
    raise exception 'Invalid cart';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if v_item->'quantity' is null or jsonb_typeof(v_item->'quantity') <> 'number' or (v_item->>'quantity') !~ '^[0-9]{1,2}$' then
      raise exception 'Invalid quantity';
    end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 99 or (v_item->>'productId')=any(v_seen) then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id=v_item->>'productId' and active for share;
    if not found then raise exception 'Unknown product'; end if;
    v_seen := array_append(v_seen,v_product.id);
    v_total := v_total + v_product.price*v_quantity;
    v_snapshots := v_snapshots || jsonb_build_array(jsonb_build_object('productId',v_product.id,'name',v_product.name,'price',v_product.price,'quantity',v_quantity));
  end loop;
  if p_receipt_path is null or p_receipt_path !~ '^[0-9a-f-]{36}\.jpg$' or not exists(
      select 1 from storage.objects where bucket_id='receipts' and name=p_receipt_path
    ) then raise exception 'Receipt is required'; end if;
  insert into public.orders(idempotency_key,fingerprint,name,email,phone,total,receipt_path)
    values(p_key,p_fingerprint,trim(p_name),p_email,p_phone,v_total,p_receipt_path) returning * into v_order;
  insert into public.order_items(order_id,product_id,name,price,quantity)
    select v_order.id,value->>'productId',value->>'name',(value->>'price')::integer,(value->>'quantity')::integer
    from jsonb_array_elements(v_snapshots);
  return jsonb_build_object('order',jsonb_build_object('id',v_order.id,'status',v_order.status,
    'total',v_order.total,'createdAt',v_order.created_at),'reused',false);
end;
$$;
revoke all on function public.create_order(text,text,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_order(text,text,text,text,text,jsonb,text) to service_role;

create function public.order_snapshot(p_order_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,
    'total',o.total,'status',o.status,'createdAt',o.created_at,'confirmedAt',o.confirmed_at,
    'receiptPath',o.receipt_path,'emailStatus',coalesce(e.status,'not_sent'),
    'items',(select coalesce(jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.name,
      'price',i.price,'quantity',i.quantity) order by i.product_id),'[]'::jsonb) from public.order_items i where i.order_id=o.id))
  from public.orders o left join public.email_outbox e on e.order_id=o.id where o.id=p_order_id;
$$;
revoke all on function public.order_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.order_snapshot(uuid) to service_role;

create function public.list_orders() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.order_snapshot(id) order by created_at desc),'[]'::jsonb) from public.orders;
$$;
revoke all on function public.list_orders() from public,anon,authenticated;
grant execute on function public.list_orders() to service_role;

create function public.claim_confirmation(p_order_id uuid,p_retry boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.orders; v_mail public.email_outbox; v_token uuid;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_retry and v_order.status <> 'confirmed' then raise exception 'Confirm the order first'; end if;
  if v_order.status='pending' then
    update public.orders set status='confirmed',confirmed_at=now() where id=p_order_id;
    insert into public.email_outbox(order_id) values(p_order_id) on conflict do nothing;
  end if;
  select * into v_mail from public.email_outbox where order_id=p_order_id for update;
  -- Resend retains idempotency keys for 24h; avoid uncertain replay past the window.
  if v_mail.status in ('sending','failed') and v_mail.first_attempt_at < now()-interval '23 hours' then
    update public.email_outbox set status='unknown',updated_at=now(),error='Provider reconciliation required' where order_id=p_order_id;
    return jsonb_build_object('claimed',false,'order',public.order_snapshot(p_order_id));
  end if;
  if v_mail.status='sent' or v_mail.status='unknown'
    or (v_mail.status='failed' and not p_retry)
    or (v_mail.status='sending' and (not p_retry or v_mail.claimed_at > now()-interval '2 minutes')) then
    return jsonb_build_object('claimed',false,'order',public.order_snapshot(p_order_id));
  end if;
  v_token := gen_random_uuid();
  update public.email_outbox set status='sending',claim_token=v_token,claimed_at=now(),
    attempts=attempts+1,updated_at=now() where order_id=p_order_id;
  return jsonb_build_object('claimed',true,'claimToken',v_token,'payload',v_mail.payload,'order',public.order_snapshot(p_order_id));
end;
$$;
revoke all on function public.claim_confirmation(uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_confirmation(uuid,boolean) to service_role;

create function public.prepare_email(p_order_id uuid,p_token uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update public.email_outbox set payload=coalesce(payload,p_payload),
    first_attempt_at=coalesce(first_attempt_at,now())
    where order_id=p_order_id and claim_token=p_token and status='sending' returning payload into v_payload;
  if not found then raise exception 'Email claim expired'; end if;
  return v_payload;
end;
$$;
revoke all on function public.prepare_email(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.prepare_email(uuid,uuid,jsonb) to service_role;

create function public.finish_email(p_order_id uuid,p_token uuid,p_status text,p_provider_id text default null,p_error text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('sent','failed') then raise exception 'Invalid email status'; end if;
  update public.email_outbox set status=p_status,provider_id=p_provider_id,error=p_error,updated_at=now()
    where order_id=p_order_id and claim_token=p_token and status='sending';
  return found;
end;
$$;
revoke all on function public.finish_email(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finish_email(uuid,uuid,text,text,text) to service_role;
