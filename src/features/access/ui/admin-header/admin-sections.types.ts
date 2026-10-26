import type { AdminSection } from "./admin-sections.constants";

/**
 * A section of the admin panel.
 */
export type AdminSectionValue = (typeof AdminSection)[keyof typeof AdminSection];
