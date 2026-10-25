import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ADMIN_SIGN_IN_PATH, AdminHeader, getAdmin, SignOutButton } from "@/features/access";

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("access.home");

  return { title: translate("metaTitle") };
}

// Placeholder landing until the orders work item replaces it with the orders list.
export default function AdminHomePage() {
  return (
    <>
      <AdminHeader actions={<SignOutButton />} />
      <main id="main" className="mx-auto box-content max-w-page px-5 pt-15 pb-20 md:px-8 lg:px-14">
        <Suspense>
          <AdminGreeting />
        </Suspense>
      </main>
    </>
  );
}

async function AdminGreeting() {
  const admin = await getAdmin();
  if (!admin) {
    redirect(ADMIN_SIGN_IN_PATH);
  }

  const translate = await getTranslations("access.home");

  return (
    <>
      <h1 className="font-display text-5xl leading-display font-bold tracking-display md:text-6xl">
        {translate("title", { name: admin.displayName })}
      </h1>
      <p className="mt-4 text-muted-foreground">{translate("description")}</p>
    </>
  );
}
