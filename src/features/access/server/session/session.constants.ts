import type { Route } from "next";

/**
 * Where visitors without an admin session are sent.
 */
export const ADMIN_SIGN_IN_PATH = "/admin/sign-in" satisfies Route;

/**
 * Where an admin lands after signing in.
 */
export const ADMIN_HOME_PATH = "/admin" satisfies Route;
