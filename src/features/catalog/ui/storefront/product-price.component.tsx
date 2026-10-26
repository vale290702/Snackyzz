import { useFormatter } from "next-intl";

/**
 * Props for a formatted price.
 */
type ProductPriceProps = {
  /**
   * Whole colones.
   */
  amount: number;
  className?: string | undefined;
};

/**
 * A price in colones, without decimals.
 * @param props The amount and optional classes.
 * @returns The formatted price.
 */
export function ProductPrice({ amount, className }: ProductPriceProps) {
  const format = useFormatter();

  return (
    <span className={className}>
      {format.number(amount, { style: "currency", currency: "CRC", maximumFractionDigits: 0 })}
    </span>
  );
}
