import { useTranslations } from "next-intl";

import { ProductGrid } from "./product-grid.component";
import type { ProductLookValue } from "./product-look.types";
import { BrandSwitch, ShelfEmpty, ShelfToolbar } from "./shelf-parts.component";
import type { BrandDto, BrandShelf as BrandShelfData } from "../../index";

/**
 * Props for a brand shelf.
 */
type BrandShelfProps = {
  shelf: BrandShelfData;
  look: ProductLookValue;
  empty: { title: string; body: string };
  toolbarClassName?: string;
  linkLabel?: (brand: BrandDto) => string;
};

/**
 * A brand's products with the toolbar, an empty state, and links to the other brands.
 * @param props The shelf, its look, its empty-state copy, and optional bespoke overrides.
 * @returns The shelf section.
 */
export function BrandShelf({ shelf, look, empty, toolbarClassName, linkLabel }: BrandShelfProps) {
  const translate = useTranslations("catalog.shelf");
  const { brand, products, otherBrands } = shelf;

  const firstOther = otherBrands[0];
  const suggestion = firstOther
    ? { brand: firstOther, label: translate("discover", { brand: firstOther.name }) }
    : null;
  const switchLabel =
    linkLabel ?? ((other: BrandDto) => translate("switchLink", { brand: other.name }));

  return (
    <section aria-label={brand.name}>
      <ShelfToolbar count={products.length} brand={brand} className={toolbarClassName} />
      {products.length > 0 ? (
        <ProductGrid products={products} brandLabel={brand.label} look={look} />
      ) : (
        <ShelfEmpty title={empty.title} body={empty.body} suggestion={suggestion} />
      )}
      <BrandSwitch brands={otherBrands} linkLabel={switchLabel} />
    </section>
  );
}
