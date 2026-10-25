import type { Locale } from "./config";

const loaders = {
  "es-CR": () => import("./messages/es-CR"),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

export type Messages = Awaited<ReturnType<(typeof loaders)["es-CR"]>>["default"];

export async function loadMessages(locale: Locale): Promise<Messages> {
  const loaded = await loaders[locale]();
  return loaded.default;
}
