/**
 * The parts of a Postgres error fulfillment reads to recognize an expected failure.
 */
export type DatabaseError = {
  code: string;
  message: string;
};

/**
 * A PostgREST response whose row fulfillment parses.
 */
export type DatabaseResponse = {
  data: unknown;
  error: DatabaseError | null;
};
