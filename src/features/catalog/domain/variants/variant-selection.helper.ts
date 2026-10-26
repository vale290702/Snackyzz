/**
 * The parts of a variant that choosing one depends on.
 */
type SelectableVariant = {
  id: string;
  isDefault: boolean;
};

/**
 * Pure rules for picking which variant of a product a shopper or admin is looking at.
 */
export class VariantSelection {
  private constructor() {}

  /**
   * Summarizes active storefront presentations without changing their purchase default.
   * @param variants Active presentations supplied by the storefront DTO.
   * @returns The minimum price, count and whether a choice is available.
   */
  static summary(variants: readonly { price: number }[]) {
    return {
      minimumPrice: variants.length ? Math.min(...variants.map((variant) => variant.price)) : null,
      count: variants.length,
      hasChoice: variants.length > 1,
    };
  }

  /**
   * Finds the variant a product shows first.
   * @param variants The product's variants in display order.
   * @returns The default variant, or the first one when none is flagged; null without variants.
   */
  static defaultOf<Variant extends SelectableVariant>(
    variants: readonly Variant[],
  ): Variant | null {
    return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
  }

  /**
   * Finds a chosen variant, falling back to the default when the choice is gone.
   * @param variants The product's variants in display order.
   * @param variantId The chosen variant, or null before any choice.
   * @returns The chosen variant, the default one, or null without variants.
   */
  static chosen<Variant extends SelectableVariant>(
    variants: readonly Variant[],
    variantId: string | null,
  ): Variant | null {
    const chosen = variants.find((variant) => variant.id === variantId);

    return chosen ?? VariantSelection.defaultOf(variants);
  }

  /**
   * Tells whether a shopper has a choice to make; one variant renders as a simple product.
   * @param variants The product's variants.
   * @returns True with two or more variants.
   */
  static hasChoice(variants: readonly SelectableVariant[]): boolean {
    return variants.length > 1;
  }
}
