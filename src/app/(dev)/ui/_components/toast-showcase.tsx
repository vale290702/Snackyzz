"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Toaster, toast } from "@/shared/ui/sonner";

export function ToastShowcase() {
  const t = useTranslations("common.devGallery.toast");

  function showSuccess() {
    toast.success(t("success"), {
      action: { label: t("undo"), onClick: () => undefined },
    });
  }

  function showInfo() {
    toast.info(t("info"), { description: t("infoDescription") });
  }

  function showError() {
    toast.error(t("error"), { description: t("errorDescription") });
  }

  return (
    <>
      <Toaster containerAriaLabel={t("region")} />
      <Button variant="outline" onClick={showSuccess}>
        {t("showSuccess")}
      </Button>
      <Button variant="outline" onClick={showInfo}>
        {t("showInfo")}
      </Button>
      <Button variant="outline" onClick={showError}>
        {t("showError")}
      </Button>
    </>
  );
}
