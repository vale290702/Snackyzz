import { supabase } from "./supabase.js";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}
function requireClient() {
  if (!supabase)
    throw new ApiError(
      "La tienda aún no está conectada. Podrás realizar pedidos cuando esté disponible.",
    );
  return supabase;
}
async function invoke(name, options) {
  const { data, error } = await requireClient().functions.invoke(name, options);
  if (error) {
    let message =
      "No pudimos completar la solicitud. Revisa tu conexión e inténtalo de nuevo.";
    try {
      const payload = await error.context.json();
      message =
        payload.error?.message || payload.error || payload.message || message;
    } catch {
      /* Keep actionable fallback. */
    }
    throw new ApiError(String(message), error.context?.status || 0);
  }
  return data;
}
export async function api(path, { body, headers = {} } = {}) {
  const client = requireClient();
  if (path === "/catalog") {
    const results = await Promise.all([
      client.from("products").select("*").eq("active", true).order("position"),
      client.from("sales_points").select("*").order("position"),
      client.from("store_settings").select("*").eq("id", 1).single(),
    ]);
    if (results.some((r) => r.error))
      throw new ApiError("No pudimos cargar el catálogo. Inténtalo de nuevo.");
    const settings = results[2].data;
    return {
      products: results[0].data,
      salesPoints: results[1].data,
      demoCatalog: settings.demo_catalog,
      payment: {
        number: settings.sinpe_number,
        recipient: settings.sinpe_recipient,
        configured: Boolean(settings.sinpe_number && settings.sinpe_recipient),
      },
    };
  }
  if (path === "/orders") return invoke("create-order", { body, headers });
  if (path === "/admin/session") {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) return { authenticated: false };
    const { data, error } = await client.rpc("is_admin");
    if (error || !data) {
      await client.auth.signOut();
      return { authenticated: false };
    }
    return { authenticated: true };
  }
  if (path === "/admin/login") {
    const { error } = await client.auth.signInWithPassword(body);
    if (error)
      throw new ApiError(
        "Correo o contraseña incorrectos. Inténtalo de nuevo.",
        401,
      );
    const { data, error: roleError } = await client.rpc("is_admin");
    if (roleError || !data) {
      await client.auth.signOut();
      throw new ApiError("Esta cuenta no tiene acceso de administración.", 403);
    }
    return { authenticated: true };
  }
  if (path === "/admin/logout") {
    const { error } = await client.auth.signOut();
    if (error)
      throw new ApiError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
    return { ok: true };
  }
  if (path === "/admin/orders")
    return invoke("manage-orders", { method: "GET" });
  const action = path.match(
    /^\/admin\/orders\/([^/]+)\/(confirm|retry-email)$/,
  );
  if (action)
    return invoke("manage-orders", {
      body: { orderId: decodeURIComponent(action[1]), action: action[2] },
    });
  throw new ApiError("Solicitud no disponible.");
}
