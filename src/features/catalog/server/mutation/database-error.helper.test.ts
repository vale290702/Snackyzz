import { describe, expect, it } from "vitest";

import { CatalogDatabaseError } from "./database-error.helper";
import { PostgresErrorCode } from "./mutation.constants";
import { CatalogError } from "../../domain/errors";

describe("CatalogDatabaseError", () => {
  it("maps constraint violations by constraint name", () => {
    const takenSlug = {
      code: PostgresErrorCode.UniqueViolation,
      message: 'duplicate key value violates unique constraint "products_brand_id_slug_key"',
    };
    const missingBrand = {
      code: PostgresErrorCode.ForeignKeyViolation,
      message:
        'insert or update on table "products" violates foreign key constraint "products_brand_id_fkey"',
    };
    const archivedDefault = {
      code: PostgresErrorCode.CheckViolation,
      message:
        'new row for relation "product_variants" violates check constraint "product_variants_default_not_archived_check"',
    };

    expect(CatalogDatabaseError.toCode(takenSlug)).toBe(CatalogError.SlugTaken);
    expect(CatalogDatabaseError.toCode(missingBrand)).toBe(CatalogError.BrandNotFound);
    expect(CatalogDatabaseError.toCode(archivedDefault)).toBe(CatalogError.DefaultVariantRequired);
  });

  it("maps exceptions raised by entry points and guards by message", () => {
    const mismatch = { code: PostgresErrorCode.RaisedException, message: "file_purpose_mismatch" };

    expect(CatalogDatabaseError.toCode(mismatch)).toBe(CatalogError.InvalidImage);
  });

  it("returns a failed result for expected errors", () => {
    const missingVariant = {
      code: PostgresErrorCode.RaisedException,
      message: "variant_not_found",
    };

    expect(CatalogDatabaseError.toFailure(missingVariant)).toEqual({
      ok: false,
      error: CatalogError.VariantNotFound,
    });
  });

  it("rethrows unexpected errors, including unknown constraints", () => {
    const unknownConstraint = {
      code: PostgresErrorCode.UniqueViolation,
      message: 'duplicate key value violates unique constraint "brands_pkey"',
    };
    const permissionDenied = { code: "42501", message: "permission denied for table brands" };

    expect(() => CatalogDatabaseError.toFailure(unknownConstraint)).toThrow();
    expect(() => CatalogDatabaseError.toFailure(permissionDenied)).toThrow();
  });
});
