-- Immutable ledger: creation only; no updated_at, updates or deletes.
create table inventory.stock_movements (
  id uuid not null default private.uuid_v7(),
  stock_level_id uuid not null,
  quantity_delta integer not null,
  reason inventory.movement_reason not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),

  constraint stock_movements_pkey primary key (id),
  constraint stock_movements_stock_level_id_fkey foreign key (stock_level_id)
    references inventory.stock_levels (id),
  constraint stock_movements_created_by_fkey foreign key (created_by)
    references access.admins (user_id),
  constraint stock_movements_quantity_delta_check check (quantity_delta <> 0),
  constraint stock_movements_note_check check (char_length(note) between 1 and 500),
  -- Orders adds order_id and replaces this guard with its reason/order-id invariant.
  constraint stock_movements_reason_check check (reason in ('adjustment', 'restock', 'waste'))
);

create index stock_movements_stock_level_id_id_idx on inventory.stock_movements (stock_level_id, id);

create index stock_movements_created_by_idx on inventory.stock_movements (created_by);
