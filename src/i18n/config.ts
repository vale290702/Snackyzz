export const locales = ["es-CR"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es-CR";

export const timeZone = "America/Costa_Rica";
