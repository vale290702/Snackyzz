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
