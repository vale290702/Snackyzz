import { useTranslations } from "next-intl";

import type { BrandPageProps } from "./brand-page.types";
import { BrandHeader } from "../storefront/brand-header.component";
import { BrandShelf } from "../storefront/brand-shelf.component";
import { ProductLook } from "../storefront/product-look.constants";

/**
 * The brand page every brand gets unless it has a bespoke one: its heading and its shelf.
 * @param props The brand's shelf.
 * @returns The page's main content.
 */
export function GenericBrandPage({ shelf }: BrandPageProps) {
  const translate = useTranslations("catalog.shelf");

  return (
    <main
      id="main"
      className="mx-auto box-content max-w-page px-5 pt-8 pb-15 md:px-8 md:pt-12 md:pb-22.5 lg:px-14"
    >
      <BrandHeader brand={shelf.brand} />
      <BrandShelf
        shelf={shelf}
        look={ProductLook.Classic}
        empty={{
          title: translate("emptyTitle"),
          body: translate("emptyBody", { brand: shelf.brand.name }),
        }}
      />
    </main>
  );
}
