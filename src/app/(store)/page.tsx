import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("common.home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-page flex-col justify-center gap-6 px-4">
      <h1 className="font-display text-display">{t("title")}</h1>
      <p className="max-w-prose text-lg text-muted-foreground">{t("comingSoon")}</p>
    </main>
  );
}
