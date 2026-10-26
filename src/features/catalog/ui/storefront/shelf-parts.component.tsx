import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import { BrandPaths } from "./brand-path.helper";
import type { BrandDto } from "../../index";

const SWITCH_TITLE_ID = "brand-switch-title";

const TEXT_LINK =
  "inline-flex items-center gap-3 text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-orange-deep";

/**
 * The line above a shelf's products: how many there are, and the brand's tagline or label.
 * @param props The product count, the brand, and extra classes for a bespoke page.
 * @returns The toolbar.
 */
export function ShelfToolbar({
  count,
  brand,
  className,
}: {
  count: number;
  brand: BrandDto;
  className?: string | undefined;
}) {
  const translate = useTranslations("catalog.shelf");

  return (
    <div
      className={cn(
        "mb-4.5 flex justify-between gap-4 border-b border-border pb-4 text-xs text-muted-foreground",
        className,
      )}
    >
      <span>{translate("count", { count })}</span>
      <span>{brand.tagline ?? brand.label}</span>
    </div>
  );
}

/**
 * What a brand's shelf shows before it has products, with a link to another brand.
 * @param props The empty-state copy and the brand to suggest, if any.
 * @returns The empty state.
 */
export function ShelfEmpty({
  title,
  body,
  suggestion,
}: {
  title: string;
  body: string;
  suggestion: { brand: BrandDto; label: string } | null;
}) {
  return (
    <div className="pt-10.5 pb-12.5">
      <ShoppingBag aria-hidden className="mb-6 size-10" strokeWidth={1.7} />
      <h2 className="font-display text-3xl leading-display font-bold tracking-display md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 mb-6 max-w-md text-muted-foreground">{body}</p>
      {suggestion && (
        <Link href={BrandPaths.of(suggestion.brand)} className={TEXT_LINK}>
          {suggestion.label}
          <ArrowRight aria-hidden className="size-5" strokeWidth={1.7} />
        </Link>
      )}
    </div>
  );
}

/**
 * Links from one brand's shelf to the others: every brand shares one cart.
 * @param props The other brands and how to label each link.
 * @returns The links, or nothing when there is no other brand.
 */
export function BrandSwitch({
  brands,
  linkLabel,
}: {
  brands: BrandDto[];
  linkLabel: (brand: BrandDto) => string;
}) {
  const translate = useTranslations("catalog.shelf");
  if (brands.length === 0) {
    return null;
  }

  return (
    <nav aria-labelledby={SWITCH_TITLE_ID} className="mt-9 border-t border-border pt-6">
      <p id={SWITCH_TITLE_ID} className="mb-2 text-sm text-muted-foreground">
        {translate("switchTitle", { count: brands.length + 1 })}
      </p>
      <ul className="flex flex-col gap-1">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link href={BrandPaths.of(brand)} className={TEXT_LINK}>
              {linkLabel(brand)}
              <ArrowRight aria-hidden className="size-5" strokeWidth={1.7} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
