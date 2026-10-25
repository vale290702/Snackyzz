import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isProduction } from "@/shared/config/runtime";

import { BadgeShowcase } from "./_components/badge-showcase";
import { ButtonShowcase } from "./_components/button-showcase";
import { CardShowcase } from "./_components/card-showcase";
import { ChoiceShowcase } from "./_components/choice-showcase";
import { FieldShowcase } from "./_components/field-showcase";
import { OverlayShowcase } from "./_components/overlay-showcase";
import { TableShowcase } from "./_components/table-showcase";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.devGallery");

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

// Dev-only gallery of every shared/ui primitive, for checking styling in the browser.
export default async function UiGalleryPage() {
  if (isProduction()) {
    notFound();
  }

  const t = await getTranslations("common.devGallery");

  return (
    <main className="mx-auto flex max-w-page flex-col gap-16 px-4 py-10 sm:px-6 md:px-10 md:py-16">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-display text-balance">{t("title")}</h1>
        <p className="max-w-prose text-lg text-muted-foreground">{t("intro")}</p>
      </header>
      <ButtonShowcase />
      <FieldShowcase />
      <ChoiceShowcase />
      <BadgeShowcase />
      <CardShowcase />
      <TableShowcase />
      <OverlayShowcase />
    </main>
  );
}
