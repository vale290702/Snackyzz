"use client";

import { Dialog, DialogTrigger } from "@/shared/ui/dialog";

import { AddToCartButton } from "./add-to-cart-button.component";
import { ProductDialog } from "./product-dialog.component";
import {
  productBrandVariants,
  productHeadingVariants,
  productNameVariants,
  productPriceVariants,
} from "./product-look.constants";
import type { ProductLookValue } from "./product-look.types";
import { ProductPhoto } from "./product-photo.component";
import { ProductPrice } from "./product-price.component";
import { useProductCard } from "../../hooks/storefront/use-product-card.hook";
import type { ProductDto, VariantDto } from "../../index";

/**
 * Props for a product card.
 */
type ProductCardProps = {
  product: ProductDto;
  brandLabel: string | null;
  look: ProductLookValue;
};

/**
 * A product on a brand's shelf: photo, name, default price, brand label, description and the
 * add-to-cart button. The photo and the name open the product's detail dialog.
 * @param props The product, its brand label and the shelf's look.
 * @returns The card with its dialog.
 */
export function ProductCard({ product, brandLabel, look }: ProductCardProps) {
  const { defaultVariant, canAdd, addToCart } = useProductCard(product);

  return (
    <Dialog>
      <article className="flex min-w-0 flex-col">
        <DialogTrigger asChild>
          <ProductPhoto product={product} look={look} />
        </DialogTrigger>
        <ProductHeading product={product} defaultVariant={defaultVariant} look={look} />
        {brandLabel && <p className={productBrandVariants({ look })}>{brandLabel}</p>}
        <p className="mt-2.5 mb-4.5 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <AddToCartButton canAdd={canAdd} onAdd={addToCart} look={look} />
      </article>
      <ProductDialog product={product} brandLabel={brandLabel} />
    </Dialog>
  );
}

type ProductHeadingProps = {
  product: ProductDto;
  defaultVariant: VariantDto | null;
  look: ProductLookValue;
};

function ProductHeading({ product, defaultVariant, look }: ProductHeadingProps) {
  return (
    <div className={productHeadingVariants({ look })}>
      <h3 className={productNameVariants({ look })}>
        <DialogTrigger className="text-left">{product.name}</DialogTrigger>
      </h3>
      {defaultVariant && (
        <ProductPrice amount={defaultVariant.price} className={productPriceVariants({ look })} />
      )}
    </div>
  );
}
