import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/shared/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { GallerySection } from "./gallery-section";

export async function FieldShowcase() {
  const t = await getTranslations("common.devGallery.fields");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <Card className="max-w-xl">
        <CardContent>
          <TextFields />
        </CardContent>
      </Card>
    </GallerySection>
  );
}

async function TextFields() {
  const t = await getTranslations("common.devGallery.fields");

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="gallery-name">{t("name.label")}</FieldLabel>
        <Input
          id="gallery-name"
          autoComplete="name"
          placeholder={t("name.placeholder")}
          aria-describedby="gallery-name-description"
        />
        <FieldDescription id="gallery-name-description">{t("name.description")}</FieldDescription>
      </Field>
      <Field data-invalid="true">
        <FieldLabel htmlFor="gallery-phone">{t("phone.label")}</FieldLabel>
        <Input
          id="gallery-phone"
          type="tel"
          defaultValue="8888"
          aria-invalid="true"
          aria-describedby="gallery-phone-error"
        />
        <FieldError id="gallery-phone-error">{t("phone.error")}</FieldError>
      </Field>
      <Field data-disabled="true">
        <FieldLabel htmlFor="gallery-order-code">{t("orderCode.label")}</FieldLabel>
        <Input id="gallery-order-code" defaultValue="SNK-0042" disabled />
      </Field>
      <FulfillmentField />
      <Field>
        <FieldLabel htmlFor="gallery-notes">{t("notes.label")}</FieldLabel>
        <Textarea id="gallery-notes" placeholder={t("notes.placeholder")} />
      </Field>
    </FieldGroup>
  );
}

async function FulfillmentField() {
  const t = await getTranslations("common.devGallery.fields.fulfillment");

  return (
    <Field>
      <FieldLabel htmlFor="gallery-fulfillment">{t("label")}</FieldLabel>
      <Select>
        <SelectTrigger id="gallery-fulfillment">
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pickup">{t("pickup")}</SelectItem>
          <SelectItem value="delivery">{t("delivery")}</SelectItem>
          <SelectItem value="locker" disabled>
            {t("locker")}
          </SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}
