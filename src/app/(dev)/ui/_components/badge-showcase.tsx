import { getTranslations } from "next-intl/server";

import { Badge } from "@/shared/ui/badge";

import { GallerySection } from "./gallery-section";
import { statusVariant, type SampleStatus } from "./sample-orders";

const statuses = Object.keys(statusVariant) as SampleStatus[];

export async function BadgeShowcase() {
  const t = await getTranslations("common.devGallery.badges");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{t("neutral")}</Badge>
          <Badge variant="brand">{t("brand")}</Badge>
          <Badge variant="selected">{t("selected")}</Badge>
          <Badge variant="outline">{t("outline")}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Badge key={status} variant={statusVariant[status]}>
              {t(status)}
            </Badge>
          ))}
        </div>
      </div>
    </GallerySection>
  );
}
