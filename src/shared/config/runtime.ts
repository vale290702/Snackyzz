/**
 * Whether this is a production build. Next inlines `NODE_ENV` at build time.
 * @returns True in `next build` / `next start`, false in `next dev` and tests.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
