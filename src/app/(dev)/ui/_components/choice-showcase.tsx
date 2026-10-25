import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/shared/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { GallerySection } from "./gallery-section";

export async function ChoiceShowcase() {
  const t = await getTranslations("common.devGallery.choices");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <Card className="max-w-xl">
        <CardContent>
          <ChoiceFields />
        </CardContent>
      </Card>
    </GallerySection>
  );
}

async function ChoiceFields() {
  const t = await getTranslations("common.devGallery.choices");

  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox id="gallery-terms" defaultChecked />
        <FieldLabel htmlFor="gallery-terms">{t("terms")}</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="gallery-updates" aria-describedby="gallery-updates-description" />
        <FieldContent>
          <FieldLabel htmlFor="gallery-updates">{t("updates.label")}</FieldLabel>
          <FieldDescription id="gallery-updates-description">
            {t("updates.description")}
          </FieldDescription>
        </FieldContent>
      </Field>
      <PickupWindowField />
      <FulfillmentMethodField />
    </FieldGroup>
  );
}

async function PickupWindowField() {
  const t = await getTranslations("common.devGallery.choices.window");

  return (
    <FieldSet>
      <FieldLegend variant="label">{t("legend")}</FieldLegend>
      <RadioGroup defaultValue="morning">
        <Field orientation="horizontal">
          <RadioGroupItem value="morning" id="gallery-window-morning" />
          <FieldLabel htmlFor="gallery-window-morning">{t("morning")}</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="afternoon" id="gallery-window-afternoon" />
          <FieldLabel htmlFor="gallery-window-afternoon">{t("afternoon")}</FieldLabel>
        </Field>
        <Field orientation="horizontal" data-disabled="true">
          <RadioGroupItem value="evening" id="gallery-window-evening" disabled />
          <FieldLabel htmlFor="gallery-window-evening">{t("evening")}</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  );
}

async function FulfillmentMethodField() {
  const t = await getTranslations("common.devGallery.choices.method");

  return (
    <FieldSet>
      <FieldLegend variant="label">{t("legend")}</FieldLegend>
      <RadioGroup defaultValue="pickup" className="sm:grid-cols-2">
        <ChoiceCard value="pickup" title={t("pickupTitle")} description={t("pickupDescription")} />
        <ChoiceCard
          value="delivery"
          title={t("deliveryTitle")}
          description={t("deliveryDescription")}
        />
      </RadioGroup>
    </FieldSet>
  );
}

type ChoiceCardProps = {
  value: string;
  title: string;
  description: string;
};

function ChoiceCard({ value, title, description }: ChoiceCardProps) {
  const id = `gallery-method-${value}`;

  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <RadioGroupItem value={value} id={id} />
      </Field>
    </FieldLabel>
  );
}
