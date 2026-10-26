import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";

export default async function Forbidden() {
  const t = await getTranslations("common.forbidden");

  return (
    <main className="mx-auto flex min-h-dvh max-w-page flex-col items-start justify-center gap-6 px-4">
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Button asChild variant="dark">
        <Link href="/admin">{t("backAdmin")}</Link>
      </Button>
    </main>
  );
}
