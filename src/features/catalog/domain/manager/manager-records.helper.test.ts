import { describe, expect, it } from "vitest";

import { ManagerRecords } from "./manager-records.helper";
import { RecordStatusFilter } from "./manager.constants";

const active = { id: "a", brandId: "b1", archivedAt: null };
const archived = { id: "b", brandId: "b2", archivedAt: "2026-10-01T00:00:00Z" };
const records = [active, archived];

describe("ManagerRecords", () => {
  it("tells active records from archived ones", () => {
    expect(ManagerRecords.isActive(active)).toBe(true);
    expect(ManagerRecords.isActive(archived)).toBe(false);
  });

  it("filters by status, keeping the order", () => {
    expect(ManagerRecords.withStatus(records, RecordStatusFilter.All)).toEqual(records);
    expect(ManagerRecords.withStatus(records, RecordStatusFilter.Active)).toEqual([active]);
    expect(ManagerRecords.withStatus(records, RecordStatusFilter.Archived)).toEqual([archived]);
  });

  it("filters by parent, or keeps everything without one", () => {
    expect(ManagerRecords.ofParent(records, "brandId", "b2")).toEqual([archived]);
    expect(ManagerRecords.ofParent(records, "brandId", null)).toEqual(records);
  });
});
