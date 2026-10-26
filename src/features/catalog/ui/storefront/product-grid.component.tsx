import { ProductCard } from "./product-card.component";
import { productGridVariants } from "./product-look.constants";
import type { ProductLookValue } from "./product-look.types";
import type { ProductDto } from "../../index";

/**
 * Props for a product grid.
 */
type ProductGridProps = {
  products: ProductDto[];
  brandLabel: string | null;
  look: ProductLookValue;
};

/**
 * One brand's products in a responsive grid.
 * @param props The products, their brand label and the shelf's look.
 * @returns The grid.
 */
export function ProductGrid({ products, brandLabel, look }: ProductGridProps) {
  return (
    <div className={productGridVariants({ look })}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} brandLabel={brandLabel} look={look} />
      ))}
    </div>
  );
}
