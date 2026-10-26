import { describe, expect, it } from "vitest";

import { CatalogOrderDirection } from "./catalog-ordering.constants";
import { CatalogOrdering } from "./catalog-ordering.helper";

const records = [
  { id: "a", sortOrder: 0, archivedAt: null, parent: "one" },
  { id: "b", sortOrder: 0, archivedAt: null, parent: "one" },
  { id: "other", sortOrder: 0, archivedAt: null, parent: "two" },
  { id: "gone", sortOrder: 1, archivedAt: "2026-10-01", parent: "one" },
  { id: "c", sortOrder: 8, archivedAt: null, parent: "one" },
] as const;

describe("CatalogOrdering", () => {
  it("orders display records numerically with stable ties without changing the input", () => {
    const source = [records[4], records[1], records[0]];
    expect(CatalogOrdering.ordered(source)).toEqual([records[1], records[0], records[4]]);
    expect(source).toEqual([records[4], records[1], records[0]]);
  });

  it("moves within the active parent scope and normalizes ties independently of names", () => {
    expect(CatalogOrdering.move(records, "b", CatalogOrderDirection.Up, "parent")).toEqual([
      { ...records[0], sortOrder: 1 },
      { ...records[4], sortOrder: 2 },
    ]);
    expect(records[0]?.sortOrder).toBe(0);
  });

  it("updates only changed ranks in the final order", () => {
    const ordered = records.slice(0, 2).map((record, sortOrder) => ({ ...record, sortOrder }));
    expect(CatalogOrdering.move(ordered, "a", CatalogOrderDirection.Down)).toEqual([
      { ...ordered[1], sortOrder: 0 },
      { ...ordered[0], sortOrder: 1 },
    ]);
  });

  it("disables list edges, archived and missing records without normalizing them", () => {
    expect(CatalogOrdering.canMove(records, "a", CatalogOrderDirection.Up, "parent")).toBe(false);
    expect(CatalogOrdering.canMove(records, "c", CatalogOrderDirection.Down, "parent")).toBe(false);
    expect(CatalogOrdering.canMove(records, "gone", CatalogOrderDirection.Up)).toBe(false);
    expect(CatalogOrdering.canMove(records, "missing", CatalogOrderDirection.Up)).toBe(false);
    expect(CatalogOrdering.move(records, "a", CatalogOrderDirection.Up, "parent")).toEqual([]);
  });

  it("sorts numeric ranks while preserving source order for ties", () => {
    expect(
      CatalogOrdering.move([records[4], records[0], records[1]], "b", CatalogOrderDirection.Down),
    ).toEqual([
      { ...records[4], sortOrder: 1 },
      { ...records[1], sortOrder: 2 },
    ]);
  });
});
