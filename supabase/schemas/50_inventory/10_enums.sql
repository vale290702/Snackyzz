create type inventory.movement_reason as enum (
  'adjustment',
  'restock',
  'waste',
  'order_reservation',
  'order_release'
);
