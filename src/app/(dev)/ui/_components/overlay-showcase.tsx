import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import { GallerySection } from "./gallery-section";
import { ToastShowcase } from "./toast-showcase";

export async function OverlayShowcase() {
  const t = await getTranslations("common.devGallery.overlays");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <div className="flex flex-wrap gap-3">
        <CancelOrderDialog />
        <CartSheet />
        <FiltersSheet />
        <ToastShowcase />
      </div>
    </GallerySection>
  );
}

async function CancelOrderDialog() {
  const t = await getTranslations("common.devGallery");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">{t("overlays.dialogOpen")}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("overlays.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("overlays.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <CancelOrderActions />
      </DialogContent>
    </Dialog>
  );
}

async function CancelOrderActions() {
  const t = await getTranslations("common.devGallery.overlays");

  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">{t("dialogKeep")}</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button variant="destructive">{t("dialogConfirm")}</Button>
      </DialogClose>
    </DialogFooter>
  );
}

async function CartSheet() {
  const t = await getTranslations("common.devGallery");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="dark">{t("overlays.sheetOpen")}</Button>
      </SheetTrigger>
      <SheetContent closeLabel={t("close")}>
        <SheetHeader>
          <SheetTitle>{t("overlays.sheetTitle")}</SheetTitle>
          <SheetDescription>{t("overlays.sheetDescription")}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button>{t("overlays.sheetCheckout")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

async function FiltersSheet() {
  const t = await getTranslations("common.devGallery");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">{t("overlays.bottomSheetOpen")}</Button>
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel={t("close")}>
        <SheetHeader>
          <SheetTitle>{t("overlays.bottomSheetTitle")}</SheetTitle>
          <SheetDescription>{t("overlays.bottomSheetDescription")}</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
