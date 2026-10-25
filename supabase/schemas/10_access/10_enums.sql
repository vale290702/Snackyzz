-- Roles stay an enum on admins at this scale (DOM-13); what each role may do is private.role_permissions.
create type access.admin_role as enum (
  'owner',
  'staff'
);

-- Closed, code-coupled set (DB-05): a misspelled permission in a policy fails when the policy is created.
create type access.permission as enum (
  'orders.view',
  'orders.decide',
  'inventory.manage',
  'notifications.manage_own',
  'catalog.manage',
  'fulfillment.manage',
  'retail.manage',
  'themes.manage',
  'settings.manage',
  'admins.manage',
  'reports.view'
);
