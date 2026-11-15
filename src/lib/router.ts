export const routes = [
  "home",
  "shop",
  "baking-stereo",
  "sales",
  "about",
  "checkout",
  "success",
  "admin",
] as const;
export type Route = typeof routes[number];

export function getRouteFromHash(hash = typeof window === "undefined" ? "" : window.location.hash) {
  const route = hash.replace(/^#\/?/, "") || "home";
  return routes.includes(route as Route) ? route as Route : "home";
}

export function navigateTo(route: string) {
  const safeRoute = routes.includes(route as Route) ? route as Route : "home";
  globalThis.location.hash = safeRoute === "home" ? "" : `#${safeRoute}`;
  return safeRoute;
}
