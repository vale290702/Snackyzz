"use client";
import { useCallback, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type {
  AdminState,
  Order,
  Product,
  SalesPoint,
  Settings,
  StoreResponse,
} from "./types";
const initial: AdminState = {
  authenticated: false,
  loaded: false,
  loading: true,
  busy: false,
  orders: [],
  products: [],
  settings: null,
  locations: [],
  emailConfigured: false,
  editingLocation: null,
  view: "orders",
  productFilter: "all",
  productBrandFilter: "all",
  editingProduct: null,
  filter: "pending",
  search: "",
  selected: null,
  error: "",
};
export function useAdmin({
  notify,
  onCatalogChange,
}: {
  notify: (message: string) => void;
  onCatalogChange: () => void | Promise<void>;
}) {
  const [state, setState] = useState<AdminState>(initial);
  const current = useRef(state);
  current.current = state;
  const revision = useRef(0);
  const patch = useCallback((value: Partial<AdminState>) => {
    current.current = {
      ...current.current,
      ...value,
      formRevision: (current.current.formRevision ?? 0) + 1,
    };
    setState(current.current);
  }, []);
  const reset = useCallback(() => {
    revision.current++;
    patch({
      authenticated: false,
      loaded: false,
      loading: false,
      busy: false,
      orders: [],
      products: [],
      editingProduct: null,
      selected: null,
      error: "",
    });
  }, [patch]);
  const reject = (error: unknown) => {
    if (error instanceof ApiError && [401, 403].includes(error.status)) reset();
    patch({ error: error instanceof Error ? error.message : String(error) });
  };
  async function fetchData() {
    const [{ orders }, { products }, store] = await Promise.all([
      api<{ orders: Order[] }>("/admin/orders"),
      api<{ products: Product[] }>("/admin/products"),
      api<StoreResponse>("/admin/store"),
    ]);
    return {
      authenticated: true,
      orders,
      products,
      settings: store.settings,
      locations: store.locations,
      emailConfigured: store.emailConfigured,
      loaded: true,
    };
  }
  async function load() {
    const rev = revision.current;
    patch({ loading: true, error: "" });
    try {
      const session = await api<{ authenticated: boolean }>("/admin/session");
      if (rev !== revision.current) return;
      if (!session.authenticated) {
        reset();
        patch({ loaded: true });
        return;
      }
      const data = await fetchData();
      if (rev === revision.current) patch(data);
    } catch (error) {
      if (rev === revision.current) reject(error);
    } finally {
      if (rev === revision.current) patch({ loading: false });
    }
  }
  async function login(email: string, password: string) {
    const rev = revision.current;
    patch({ busy: true, error: "" });
    try {
      await api("/admin/login", { body: { email, password } });
      const data = await fetchData();
      if (rev === revision.current) patch(data);
    } catch (error) {
      patch({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      patch({ busy: false });
    }
  }
  async function logout() {
    try {
      await api("/admin/logout");
      reset();
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error));
    }
  }
  async function action(id: string, action: string) {
    if (current.current.busy) return;
    const rev = revision.current;
    patch({ busy: true, error: "" });
    try {
      const { order } = await api<{ order: Order }>(
        `/admin/orders/${encodeURIComponent(id)}/${action}`,
      );
      if (rev !== revision.current) return;
      patch({
        orders: current.current.orders.map((o) => (o.id === id ? order : o)),
      });
      notify(
        order.emailStatus === "sent"
          ? "Orden confirmada. Correo enviado."
          : ["failed", "sending"].includes(order.emailStatus)
            ? "Orden confirmada. El correo no se pudo enviar; puedes reintentarlo."
            : "Estado de la orden actualizado.",
      );
    } catch (error) {
      if (rev === revision.current) reject(error);
    } finally {
      if (rev === revision.current) patch({ busy: false });
    }
  }
  async function saveProduct(body: FormData) {
    if (current.current.busy) {
      await onCatalogChange();
      return;
    }
    patch({ view: "products", busy: true, error: "" });
    try {
      const { product } = await api<{ product: Product }>(
        "/admin/products/save",
        { body },
      );
      patch({
        products: (current.current.products.some((p) => p.id === product.id)
          ? current.current.products.map((p) =>
              p.id === product.id ? product : p,
            )
          : [...current.current.products, product]
        ).sort((a, b) => a.position - b.position),
        editingProduct: null,
      });
      notify("Producto guardado.");
    } catch (error) {
      reject(error);
    } finally {
      patch({ busy: false });
      await onCatalogChange();
    }
  }
  async function productAction(id: string, action: string) {
    if (current.current.busy) return;
    patch({ view: "products", busy: true, error: "" });
    try {
      const { product } = await api<{ product: Product }>(
        `/admin/products/${encodeURIComponent(id)}/${action}`,
      );
      patch({
        products: current.current.products.map((p) =>
          p.id === product.id ? product : p,
        ),
        editingProduct: null,
      });
      notify(
        action === "archive" ? "Producto archivado." : "Producto restaurado.",
      );
    } catch (error) {
      reject(error);
    } finally {
      patch({ busy: false });
    }
  }
  async function storeAction(body: Record<string, unknown>, message: string) {
    if (current.current.busy) {
      await onCatalogChange();
      return;
    }
    patch({ busy: true, error: "" });
    try {
      const result = await api<{ settings?: Settings; location?: SalesPoint }>(
        "/admin/store/action",
        { body },
      );
      if (result.settings) patch({ settings: result.settings });
      if (result.location) {
        const location = result.location;
        patch({
          locations: (current.current.locations.some(
            (p) => p.id === location.id,
          )
            ? current.current.locations.map((p) =>
                p.id === location.id ? location : p,
              )
            : [...current.current.locations, location]
          ).sort((a, b) => a.position - b.position),
        });
      }
      patch({ editingLocation: null });
      notify(message);
    } catch (error) {
      reject(error);
    } finally {
      patch({ busy: false });
      await onCatalogChange();
    }
  }
  return {
    state,
    patch,
    load,
    login,
    logout,
    action,
    saveProduct,
    productAction,
    storeAction,
    reset,
  };
}
export type AdminController = ReturnType<typeof useAdmin>;
