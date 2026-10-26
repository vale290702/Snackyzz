import { cva } from "class-variance-authority";

/**
 * How a brand's page dresses its product cards: the shop's look, or a collab's editorial look.
 */
export const ProductLook = {
  Classic: "classic",
  Editorial: "editorial",
} as const;

/**
 * The product grid's columns and gaps.
 */
export const productGridVariants = cva("grid grid-cols-1 sm:grid-cols-2", {
  variants: {
    look: {
      classic: "gap-8 sm:gap-x-6",
      editorial: "gap-10 sm:gap-x-7 sm:gap-y-12",
    },
  },
});

/**
 * The square photo button that opens a product's details.
 */
export const productPhotoVariants = cva(
  [
    "group/photo relative block aspect-product-phone w-full overflow-hidden p-0 text-left sm:aspect-square",
    "focus-visible:outline-2 focus-visible:outline-offset-4",
  ],
  {
    variants: {
      look: {
        classic: "rounded-surface bg-cream-tint focus-visible:outline-orange-deep",
        editorial: "rounded-none bg-baking-blush focus-visible:outline-baking-rose",
      },
    },
  },
);

/**
 * The product photo inside its button, which zooms on hover.
 */
export const productImageVariants = cva(
  "size-full object-cover transition-transform motion-reduce:transition-none",
  {
    variants: {
      look: {
        classic: "duration-500 group-hover/photo:scale-105",
        editorial: "duration-400 ease-out group-hover/photo:scale-102",
      },
    },
  },
);

/**
 * The short badge over the photo.
 */
export const productTagVariants = cva(
  "absolute top-4 left-4 text-xs leading-tight text-chocolate",
  {
    variants: {
      look: {
        classic: "rounded-round bg-paper px-3 py-2 font-semibold",
        editorial: "rounded-xs bg-baking-pink px-2.5 py-1.5 font-medium",
      },
    },
  },
);

/**
 * The "see cookie" hint that appears over the photo on hover and focus.
 */
export const productPhotoActionVariants = cva(
  [
    "absolute right-3 bottom-3 flex items-center gap-2 px-2.5 py-1.5 text-xs transition",
    "motion-reduce:transition-none sm:translate-y-1 sm:opacity-0",
    "group-hover/photo:translate-y-0 group-hover/photo:opacity-100",
    "group-focus-visible/photo:translate-y-0 group-focus-visible/photo:opacity-100",
  ],
  {
    variants: {
      look: {
        classic: "rounded-3xl bg-paper",
        editorial: "rounded-none bg-baking-ivory text-chocolate",
      },
    },
  },
);

/**
 * The row with the product name and its price.
 */
export const productHeadingVariants = cva("flex justify-between", {
  variants: {
    look: {
      classic: "mt-5 items-center gap-2.5 md:max-lg:flex-col md:max-lg:items-start md:max-lg:gap-2",
      editorial: "mt-5.5 items-start gap-3",
    },
  },
});

/**
 * The product name.
 */
export const productNameVariants = cva("text-left text-balance", {
  variants: {
    look: {
      classic: "font-display text-2xl leading-display font-bold tracking-display",
      editorial: "font-editorial text-3xl leading-tight font-normal tracking-tight",
    },
  },
});

/**
 * The price next to the product name.
 */
export const productPriceVariants = cva("whitespace-nowrap tabular-nums", {
  variants: {
    look: {
      classic: "text-base font-semibold",
      editorial: "pt-1 text-sm font-medium",
    },
  },
});

/**
 * The brand label under the name.
 */
export const productBrandVariants = cva("text-xs", {
  variants: {
    look: {
      classic: "mt-4 mb-2 font-bold text-chocolate",
      editorial: "my-3.5 font-medium text-baking-rose",
    },
  },
});

/**
 * The add-to-cart button at the bottom of a card.
 */
export const addToCartVariants = cva(
  [
    "flex min-h-11.5 w-full items-center justify-between gap-2.5 border px-4 text-xs font-semibold",
    "transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
    "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
  ],
  {
    variants: {
      look: {
        classic:
          "rounded-control border-border py-2.5 focus-visible:outline-orange-deep enabled:hover:border-orange enabled:hover:bg-orange",
        editorial:
          "mt-5 rounded-xs border-baking-pink py-3 focus-visible:outline-baking-rose enabled:hover:bg-baking-pink",
      },
    },
  },
);
