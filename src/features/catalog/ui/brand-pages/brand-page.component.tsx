import type { BrandPageProps } from "./brand-page.types";
import { BESPOKE_BRAND_PAGES } from "./brand-pages.constants";
import { GenericBrandPage } from "./generic-brand-page.component";

/**
 * A brand's storefront page: its bespoke page when it has one, the generic one otherwise.
 * @param props The brand's shelf.
 * @returns The page's main content.
 */
export function BrandPage({ shelf }: BrandPageProps) {
  const Page = BESPOKE_BRAND_PAGES[shelf.brand.slug] ?? GenericBrandPage;

  return <Page shelf={shelf} />;
}
