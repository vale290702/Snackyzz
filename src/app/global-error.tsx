"use client";

import { createTranslator } from "next-intl";

import { defaultLocale } from "@/i18n/config";
import common from "@/i18n/messages/es-CR/common.json";
import { Button } from "@/shared/ui/button";

import "@/styles/globals.css";

// The root layout (and its intl provider) is gone when this renders, so translate directly.
const t = createTranslator({
  locale: defaultLocale,
  messages: { common },
  namespace: "common.globalError",
});

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang={defaultLocale}>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-page flex-col items-start justify-center gap-6 px-4">
          <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
          <Button onClick={retry}>{t("retry")}</Button>
        </main>
      </body>
    </html>
  );
}
