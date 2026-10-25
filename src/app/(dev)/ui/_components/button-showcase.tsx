import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";

import { GallerySection } from "./gallery-section";

export async function ButtonShowcase() {
  const t = await getTranslations("common.devGallery.buttons");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button>{t("primary")}</Button>
        <Button variant="dark">{t("dark")}</Button>
        <Button variant="outline">{t("outline")}</Button>
        <Button variant="ghost">{t("ghost")}</Button>
        <Button variant="destructive">{t("destructive")}</Button>
        <Button variant="link">{t("link")}</Button>
        <Button size="sm">{t("small")}</Button>
        <Button disabled>{t("disabled")}</Button>
      </div>
    </GallerySection>
  );
}
