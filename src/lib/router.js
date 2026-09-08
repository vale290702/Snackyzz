export const routes = [
  "home",
  "shop",
  "sales",
  "about",
  "checkout",
  "success",
  "admin",
];

export function getRouteFromHash(hash = globalThis.location?.hash ?? "") {
  const route = hash.replace(/^#\/?/, "") || "home";
  return routes.includes(route) ? route : "home";
}

export function navigateTo(route) {
  const safeRoute = routes.includes(route) ? route : "home";
  globalThis.location.hash = safeRoute === "home" ? "" : `#${safeRoute}`;
  return safeRoute;
}
