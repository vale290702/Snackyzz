import type { Route } from "next";

import type { AdminSectionValue } from "./admin-sections.types";

/**
 * The admin panel's sections, shown as tabs in the admin header.
 */
export const AdminSection = {
  Orders: "orders",
  Catalog: "catalog",
} as const;

/**
 * Each section's tab, in the order the header shows them. Settings joins once it has a route.
 */
export const ADMIN_SECTION_TABS: readonly { section: AdminSectionValue; href: Route }[] = [
  { section: AdminSection.Orders, href: "/admin" },
  { section: AdminSection.Catalog, href: "/admin/catalog" },
];
