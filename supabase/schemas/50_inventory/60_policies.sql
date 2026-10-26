alter table inventory.stock_levels enable row level security;

alter table inventory.stock_movements enable row level security;

create policy stock_levels_select_for_managers on inventory.stock_levels
for select to authenticated
using ((select private.has_permission('inventory.manage')));

create policy stock_movements_select_for_managers on inventory.stock_movements
for select to authenticated
using ((select private.has_permission('inventory.manage')));
