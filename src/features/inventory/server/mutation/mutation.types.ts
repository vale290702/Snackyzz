/**
 * The parts of a Postgres error inventory reads to recognize an expected failure.
 */
export type DatabaseError = {
  code: string;
  message: string;
};

/**
 * A PostgREST response whose row inventory parses.
 */
export type DatabaseResponse = {
  data: unknown;
  error: DatabaseError | null;
};
