import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  ADMIN_HOME_PATH,
  AdminHeader,
  getAdmin,
  SignInForm,
  SignInWelcome,
} from "@/features/access";

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("access");

  return { title: translate("metaTitle") };
}

export default function SignInPage() {
  return (
    <>
      <AdminHeader />
      <main
        id="main"
        className="mx-auto box-content grid max-w-page grid-cols-1 items-center gap-8 px-5 pt-7.5 pb-13.75 sm:min-h-140 sm:grid-cols-2 sm:gap-9 sm:pt-15 sm:pb-20 md:min-h-170 md:gap-25 md:px-8 lg:px-14"
      >
        <SignInWelcome />
        <SignInForm />
      </main>
      <Suspense>
        <RedirectSignedInAdmin />
      </Suspense>
    </>
  );
}

async function RedirectSignedInAdmin() {
  const admin = await getAdmin();
  if (admin) {
    redirect(ADMIN_HOME_PATH);
  }

  return null;
}
