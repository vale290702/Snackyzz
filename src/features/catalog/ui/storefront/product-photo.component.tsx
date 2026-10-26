import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import {
  productImageVariants,
  productPhotoActionVariants,
  productPhotoVariants,
  productTagVariants,
} from "./product-look.constants";
import type { ProductLookValue } from "./product-look.types";
import type { ProductDto } from "../../index";

/**
 * Props for a product's photo button.
 */
type ProductPhotoProps = ComponentProps<"button"> & {
  product: ProductDto;
  look: ProductLookValue;
};

/**
 * The product photo with its badge, as a button that opens the product's details.
 * @param props The product, its look, and button props from the dialog trigger.
 * @returns The photo button.
 */
export function ProductPhoto({ product, look, ...buttonProps }: ProductPhotoProps) {
  const translate = useTranslations("catalog.product");

  return (
    <button
      type="button"
      aria-label={translate("viewDetails", { name: product.name })}
      className={productPhotoVariants({ look })}
      {...buttonProps}
    >
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={640}
          height={640}
          // Catalog images are already sized by media's upload ceilings; skip the optimizer.
          unoptimized
          className={productImageVariants({ look })}
        />
      )}
      {product.badge && <span className={productTagVariants({ look })}>{product.badge}</span>}
      <span className={productPhotoActionVariants({ look })}>
        {translate("view")}
        <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.7} />
      </span>
    </button>
  );
}
