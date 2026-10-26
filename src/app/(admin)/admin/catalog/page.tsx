import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminHeader, AdminSection, SignOutButton } from "@/features/access";
import { CatalogManager, CatalogManagerSkeleton, getCatalogManager } from "@/features/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("catalog.manager");

  return { title: translate("metaTitle") };
}

export default function AdminCatalogPage() {
  return (
    <>
      <AdminHeader actions={<SignOutButton />} activeSection={AdminSection.Catalog} />
      <main id="main" className="mx-auto box-content max-w-page px-5 pt-15 pb-20 md:px-8 lg:px-14">
        <Suspense fallback={<CatalogManagerSkeleton />}>
          <ManagedCatalog />
        </Suspense>
      </main>
    </>
  );
}

// getCatalogManager requires catalog.manage: visitors go to sign-in, staff get the 403 page.
async function ManagedCatalog() {
  const data = await getCatalogManager();

  return <CatalogManager data={data} />;
}
