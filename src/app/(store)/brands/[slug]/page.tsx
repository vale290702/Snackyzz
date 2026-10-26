import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { BrandPage, CatalogShelfSkeleton, getBrandShelf } from "@/features/catalog";

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  await connection();
  const shelf = await getBrandShelf((await params).slug);

  return { title: shelf?.brand.name, description: shelf?.brand.description };
}

export default function BrandRoutePage({ params }: PageProps<"/brands/[slug]">) {
  return (
    <Suspense fallback={<CatalogShelfSkeleton />}>
      <BrandShelfBySlug params={params} />
    </Suspense>
  );
}

async function BrandShelfBySlug({ params }: Pick<PageProps<"/brands/[slug]">, "params">) {
  // CI builds have no database, so the catalog is read per request (and cached) instead of at build.
  await connection();

  const shelf = await getBrandShelf((await params).slug);
  if (!shelf) {
    notFound();
  }

  return <BrandPage shelf={shelf} />;
}
