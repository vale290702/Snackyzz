import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreActionsProvider } from "../src/components/store/actions";
const noop = () => {};
const actions = {
  changeQuantity: noop,
  openProduct: noop,
  clearCart: noop,
  selectCity: noop,
  copySinpe: noop,
  checkoutChange: noop,
  receiptChange: noop,
  submitCheckout: noop,
};
export function renderComponent<P extends object>(
  Component: ComponentType<P>,
  props: P,
) {
  return renderToStaticMarkup(
    <StoreActionsProvider actions={actions}>
      {createElement(Component, props)}
    </StoreActionsProvider>,
  );
}

import { Admin } from "../src/features/admin/Admin";
import type { AdminState } from "../src/features/admin/types";
import type { AdminController } from "../src/features/admin/useAdmin";
export function renderAdmin(overrides: Partial<AdminState>) {
  const state: AdminState = {
    authenticated: false,
    loaded: false,
    loading: false,
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
    ...overrides,
  };
  const asyncNoop = async () => {};
  const controller = {
    state,
    patch: noop,
    load: asyncNoop,
    login: asyncNoop,
    logout: asyncNoop,
    action: asyncNoop,
    saveProduct: asyncNoop,
    productAction: asyncNoop,
    storeAction: asyncNoop,
    reset: noop,
  } as AdminController;
  return renderToStaticMarkup(<Admin controller={controller} />);
}
