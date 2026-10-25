import type { CatalogImagePurpose } from "./mutation.constants";

/**
 * The upload purpose a catalog image column requires.
 */
export type CatalogImagePurposeValue =
  (typeof CatalogImagePurpose)[keyof typeof CatalogImagePurpose];

/**
 * The parts of a Postgres error the catalog reads to recognize an expected failure.
 */
export type DatabaseError = {
  code: string;
  message: string;
};

/**
 * A PostgREST response whose row the catalog parses.
 */
export type DatabaseResponse = {
  data: unknown;
  error: DatabaseError | null;
};
