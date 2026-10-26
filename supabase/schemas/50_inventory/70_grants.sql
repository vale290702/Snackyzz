revoke all on table inventory.stock_levels from public, anon, authenticated, service_role;

revoke all on table inventory.stock_movements from public, anon, authenticated, service_role;

grant select on table inventory.stock_levels to authenticated, service_role;

grant select on table inventory.stock_movements to authenticated, service_role;
