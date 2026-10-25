import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <main className="mx-auto flex min-h-dvh max-w-page flex-col items-start justify-center gap-6 px-4">
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <Button asChild variant="dark">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </main>
  );
}
