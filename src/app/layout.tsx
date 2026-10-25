import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { defaultLocale } from "@/i18n/config";

import "@/styles/globals.css";

const fraunces = localFont({
  src: "../../public/assets/fonts/fraunces-latin.woff2",
  weight: "700 800",
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = localFont({
  src: "../../public/assets/fonts/dm-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-dm-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: "common.brand" });

  return {
    title: {
      default: t("name"),
      template: `%s · ${t("name")}`,
    },
    description: t("tagline"),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
