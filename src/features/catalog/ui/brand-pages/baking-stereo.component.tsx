import { ArrowRight } from "lucide-react";
import localFont from "next/font/local";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { BrandPageProps } from "./brand-page.types";
import { BrandShelf } from "../storefront/brand-shelf.component";
import { ProductLook } from "../storefront/product-look.constants";

const bodoni = localFont({
  src: "../../../../../public/assets/fonts/bodoni-moda-regular.ttf",
  weight: "400",
  variable: "--font-bodoni",
  display: "swap",
});

const COLLECTION_ID = "baking-collection";

/**
 * The bespoke Baking Stereo page: an ivory editorial hero, an intro, and the brand's shelf in the
 * collab's pink-and-ivory look.
 * @param props The brand's shelf.
 * @returns The page's main content.
 */
export function BakingStereoPage({ shelf }: BrandPageProps) {
  const translate = useTranslations("catalog.brandPages.bakingStereo");

  return (
    <main id="main" className={`${bodoni.variable} bg-baking-ivory pb-20 text-chocolate`}>
      <BakingStereoHero brandName={shelf.brand.name} />
      <BakingStereoIntro />
      <div className="mt-8 px-5 md:px-12">
        <div className="mx-auto max-w-page">
          <BrandShelf
            shelf={shelf}
            look={ProductLook.Editorial}
            toolbarClassName="mb-6 border-0 pb-0"
            empty={{ title: translate("emptyTitle"), body: translate("emptyBody") }}
            linkLabel={(brand) => (brand.isPrimary ? translate("switchLink") : brand.name)}
          />
        </div>
      </div>
    </main>
  );
}

function BakingStereoHero({ brandName }: { brandName: string }) {
  const translate = useTranslations("catalog.brandPages.bakingStereo");

  return (
    <header className="relative overflow-hidden text-center">
      <h1 className="h-baking-hero w-full">
        <span className="sr-only">{brandName}</span>
        <Image
          src="/assets/brand/baking-stereo-ivory-hero.jpeg"
          alt=""
          width={1600}
          height={900}
          priority
          className="size-full object-cover object-baking-hero"
        />
      </h1>
      <p className="absolute inset-x-5 bottom-19 text-xs font-medium tracking-widest">
        {translate.rich("credit", {
          brand: (chunks) => <span className="text-base font-bold">{chunks}</span>,
        })}
      </p>
      <a
        href={`#${COLLECTION_ID}`}
        className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-5 border-b border-chocolate py-2.5 text-sm font-medium whitespace-nowrap hover:text-baking-rose focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-baking-rose"
      >
        {translate("explore")}
        <ArrowRight aria-hidden className="size-4.5" strokeWidth={1.7} />
      </a>
    </header>
  );
}

function BakingStereoIntro() {
  const translate = useTranslations("catalog.brandPages.bakingStereo");

  return (
    <div className="px-5 md:px-12">
      <div
        id={COLLECTION_ID}
        tabIndex={-1}
        className="mx-auto max-w-page scroll-mt-6 border-b border-baking-blush pt-12 pb-7.5 outline-none md:pt-18 md:pb-10"
      >
        <p className="mb-4 text-xs font-medium tracking-widest text-baking-rose">
          {translate("label")}
        </p>
        <h2 className="mb-4.5 font-editorial text-4xl leading-tight font-normal tracking-display text-baking-rose md:text-6xl">
          {translate("title")}
        </h2>
        <p className="max-w-[48ch] text-sm text-muted-foreground">{translate("body")}</p>
      </div>
    </div>
  );
}
