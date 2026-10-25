import type { Route } from "next";

/**
 * Where visitors without an admin session are sent.
 */
// Why: the sign-in page ships with the sign-in UI work item; until then typed routes can't see it.
export const ADMIN_SIGN_IN_PATH = "/admin/sign-in" as Route;
