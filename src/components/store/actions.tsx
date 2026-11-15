"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { StoreActions } from "../../types/store";
const Context = createContext<StoreActions | null>(null);
export function StoreActionsProvider({
  actions,
  children,
}: {
  actions: StoreActions;
  children: ReactNode;
}) {
  return <Context.Provider value={actions}>{children}</Context.Provider>;
}
export function useStoreActions() {
  const actions = useContext(Context);
  if (!actions) throw new Error("StoreActionsProvider is required");
  return actions;
}
