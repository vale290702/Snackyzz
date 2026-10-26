/**
 * Pure stock-pool selection and adjustment arithmetic, mirroring the SQL entry points.
 */
export class StockRules {
  private constructor() {}

  /**
   * Selects a location's own pool, otherwise the global pool; untracked variants use neither.
   * @param tracked Whether the variant tracks stock.
   * @param levels Pools belonging to the variant.
   * @param pickupLocationId Pickup scope, omitted for delivery.
   * @returns The selected pool, or null when no pool applies.
   */
  static resolve<Level extends { pickupLocationId: string | null }>(
    tracked: boolean,
    levels: readonly Level[],
    pickupLocationId?: string,
  ): Level | null {
    if (!tracked) {
      return null;
    }

    const location = levels.find((level) => level.pickupLocationId === pickupLocationId);

    return location ?? levels.find((level) => level.pickupLocationId === null) ?? null;
  }

  /**
   * Computes the ledger delta for a set-to adjustment; zero means no movement.
   * @param current Available quantity under the database lock.
   * @param target Desired available quantity.
   * @returns The signed change.
   */
  static adjustmentDelta(current: number, target: number): number {
    return target - current;
  }
}
