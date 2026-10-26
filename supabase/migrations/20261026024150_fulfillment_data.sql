-- The fulfillment settings singleton. Reference data, kept apart from the generated DDL migration.
-- Defaults match today's store: pickup and delivery on, 6 hours' notice, 3-hour windows.
insert into fulfillment.settings (id)
values (true)
on conflict (id) do nothing;
