import type { BrandDto } from "../../index";

/**
 * Props for a brand header.
 */
type BrandHeaderProps = {
  brand: BrandDto;
};

/**
 * A brand page's heading: the brand's name and description, both from the catalog.
 * @param props The brand.
 * @returns The header.
 */
export function BrandHeader({ brand }: BrandHeaderProps) {
  return (
    <header className="mb-7.5 border-b border-border pb-8 md:mb-10.5">
      <h1 className="font-display text-5xl leading-display font-bold tracking-display text-balance md:text-6xl">
        {brand.name}
      </h1>
      {brand.description && (
        <p className="mt-4 max-w-prose text-sm text-muted-foreground md:text-base">
          {brand.description}
        </p>
      )}
    </header>
  );
}
