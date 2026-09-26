import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
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
type SettingsRow = Partial<import("../types/database").Database["public"]["Tables"]["store_settings"]["Row"]>;
function scheduleValue(value: SettingsRow["delivery_schedule"]): Record<string, { enabled: boolean; start: string; end: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, day]) => {
    if (!day || typeof day !== "object" || Array.isArray(day) || typeof day.enabled !== "boolean" || typeof day.start !== "string" || typeof day.end !== "string") return [];
    return [[key, { enabled: day.enabled, start: day.start, end: day.end }]];
  }));
}
function storeSettings(row: SettingsRow = {}) {
  return {
    demoCatalog: Boolean(row.demo_catalog),
    payment: {
      number: row.sinpe_number ?? "",
      recipient: row.sinpe_recipient ?? "",
      configured: Boolean(row.sinpe_number && row.sinpe_recipient),
    },
    contact: {
      whatsapp: row.whatsapp ?? "",
      email: row.public_email ?? "Snackyzz.cookies@gmail.com",
      instagram: row.instagram ?? "Snackyzz.cookies",
    },
    delivery: {
      uberEnabled: row.uber_delivery_enabled !== false,
      disclaimer: row.uber_disclaimer ?? "El costo del servicio de mensajería por Uber corre por cuenta del cliente y se paga por separado.",
      leadHours: row.delivery_lead_hours ?? 6,
      slotHours: row.delivery_slot_hours ?? 3,
      schedule: scheduleValue(row.delivery_schedule),
    },
  };
}
async function invoke<T>(name: string, options: { body?: unknown; headers?: Record<string, string>; method?: "GET" | "POST" }) {
  const { data, error } = await requireClient().functions.invoke<T>(name, options as Parameters<ReturnType<typeof requireClient>["functions"]["invoke"]>[1]);
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
  if (data === null) throw new ApiError("No pudimos completar la solicitud. Inténtalo de nuevo.");
  return data;
}
export async function api<T = unknown>(path: string, { body, headers = {} }: {body?: unknown; headers?: Record<string,string>; method?: string} = {}): Promise<T> {
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
      ...storeSettings(settings ?? {}),
    } as T;
  }
  if (path === "/orders") return invoke<T>("create-order", { body, headers });
  if (path === "/admin/session") {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) return { authenticated: false } as T;
    const { data, error } = await client.rpc("is_admin");
    if (error || !data) {
      await client.auth.signOut();
      return { authenticated: false } as T;
    }
    return { authenticated: true } as T;
  }
  if (path === "/admin/login") {
    const { error } = await client.auth.signInWithPassword(body as {email:string;password:string});
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
    return { authenticated: true } as T;
  }
  if (path === "/admin/logout") {
    const { error } = await client.auth.signOut();
    if (error)
      throw new ApiError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
    return { ok: true } as T;
  }
  if (path === "/admin/orders")
    return invoke<T>("manage-orders", { method: "GET" });
  if (path === "/admin/products")
    return invoke<T>("manage-products", { method: "GET" });
  if (path === "/admin/products/save")
    return invoke<T>("manage-products", { body });
  if (path === "/admin/store") return invoke<T>("manage-store", { method: "GET" });
  if (path === "/admin/store/action") return invoke<T>("manage-store", { body });
  const productAction = path.match(
    /^\/admin\/products\/([^/]+)\/(archive|restore)$/,
  );
  if (productAction)
    return invoke<T>("manage-products", {
      body: {
        productId: decodeURIComponent(productAction[1]),
        action: productAction[2],
      },
    });
  const action = path.match(
    /^\/admin\/orders\/([^/]+)\/(confirm|retry-email)$/,
  );
  if (action)
    return invoke<T>("manage-orders", {
      body: { orderId: decodeURIComponent(action[1]), action: action[2] },
    });
  throw new ApiError("Solicitud no disponible.");
}
