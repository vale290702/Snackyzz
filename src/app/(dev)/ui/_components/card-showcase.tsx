import { getFormatter, getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

import { GallerySection } from "./gallery-section";

const SAMPLE_SUBTOTAL = 7500;

export async function CardShowcase() {
  const t = await getTranslations("common.devGallery.cards");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <div className="grid gap-6 md:grid-cols-2">
        <SummaryCard />
        <NoteCard title={t("noteTitle")} body={t("noteBody")} />
      </div>
    </GallerySection>
  );
}

function NoteCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="bg-secondary text-secondary-foreground">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

async function SummaryCard() {
  const t = await getTranslations("common.devGallery.cards");
  const format = await getFormatter();
  const subtotal = format.number(SAMPLE_SUBTOTAL, {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("summaryTitle")}</CardTitle>
        <CardDescription>{t("summaryDescription", { count: 2 })}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          <SummaryRow label={t("subtotal")} value={subtotal} />
          <Separator />
          <SummaryRow label={t("total")} value={subtotal} emphasis />
        </dl>
      </CardContent>
      <CardFooter>
        <Button className="w-full">{t("pay")}</Button>
      </CardFooter>
    </Card>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  emphasis?: boolean;
};

function SummaryRow({ label, value, emphasis = false }: SummaryRowProps) {
  return (
    <div className={emphasis ? "flex justify-between text-lg font-bold" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
