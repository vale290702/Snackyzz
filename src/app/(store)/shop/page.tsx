import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BrandPage, getBrandShelf } from "@/features/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("catalog.shop");

  return { title: translate("metaTitle") };
}

export default function ShopPage() {
  return (
    <Suspense>
      <PrimaryBrandShelf />
    </Suspense>
  );
}

async function PrimaryBrandShelf() {
  // CI builds have no database, so the catalog is read per request (and cached) instead of at build.
  await connection();

  const shelf = await getBrandShelf();
  if (!shelf) {
    notFound();
  }

  return <BrandPage shelf={shelf} />;
}
