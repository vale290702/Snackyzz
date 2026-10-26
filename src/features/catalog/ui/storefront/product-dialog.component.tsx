"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

import { ProductPrice } from "./product-price.component";
import { VariantPicker } from "./variant-picker.component";
import { useProductDialog } from "../../hooks/storefront/use-product-dialog.hook";
import type { ProductDto } from "../../index";

/**
 * Props for a product's detail dialog.
 */
type ProductDialogProps = {
  product: ProductDto;
  brandLabel: string | null;
};

/**
 * The detail dialog of a product: photo, copy, the variant picker when there are two or more
 * variants, the selected price and the add-to-cart button. Render it inside the card's `Dialog`.
 * @param props The product and its brand label.
 * @returns The dialog content.
 */
export function ProductDialog({ product, brandLabel }: ProductDialogProps) {
  const { selectedVariant, hasChoice, selectVariant, canAdd, addToCart } =
    useProductDialog(product);
  const translate = useTranslations("catalog.product");

  return (
    <DialogContent className="max-w-200 gap-0 bg-background p-0 md:grid-cols-2">
      <DialogCloseChip label={translate("closeDetails")} />
      <DialogPhoto product={product} />
      <div className="px-6 py-7 md:px-7.5 md:pt-12.5 md:pb-7.5">
        <DialogTitle className="mb-5 text-4xl leading-display tracking-display">
          {product.name}
        </DialogTitle>
        {brandLabel && <p className="mb-6 text-xs">{brandLabel}</p>}
        <DialogDescription className="mb-6 text-sm">{product.description}</DialogDescription>
        {hasChoice && selectedVariant && (
          <VariantPicker
            productId={product.id}
            variants={product.variants}
            selectedId={selectedVariant.id}
            onSelect={selectVariant}
          />
        )}
        {selectedVariant && (
          <ProductPrice
            amount={selectedVariant.price}
            className="text-2xl font-semibold tabular-nums"
          />
        )}
        <Button variant="dark" disabled={!canAdd} onClick={addToCart} className="mt-5 w-full gap-5">
          {translate("addToCart")}
          <Plus aria-hidden className="size-5" strokeWidth={1.7} />
        </Button>
      </div>
    </DialogContent>
  );
}

/**
 * The round cream close button over the dialog's corner, which stays legible over the photo on
 * phones.
 * @param props The close button's accessible label.
 * @param props.label The label read by screen readers.
 * @returns The close button.
 */
function DialogCloseChip({ label }: { label: string }) {
  return (
    <DialogClose asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 z-10 size-11 rounded-round bg-background hover:translate-y-0"
      >
        <X aria-hidden className="size-5" strokeWidth={1.7} />
        <span className="sr-only">{label}</span>
      </Button>
    </DialogClose>
  );
}

function DialogPhoto({ product }: { product: ProductDto }) {
  if (!product.imageUrl) {
    return <div aria-hidden className="h-62.5 bg-cream-tint md:h-auto md:min-h-102.5" />;
  }

  return (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={640}
      height={640}
      unoptimized
      className="h-62.5 w-full object-cover md:h-full md:min-h-102.5"
    />
  );
}
