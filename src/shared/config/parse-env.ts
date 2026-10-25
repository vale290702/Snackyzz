import type { z } from "zod";

/**
 * Validates environment variables against a schema.
 * @param schema Zod object describing the expected variables.
 * @param source Raw values, usually picked from `process.env`.
 * @returns The parsed, typed variables.
 * @throws When a variable is missing or invalid; the message names the variables, never their values.
 */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  source: Record<string, string | undefined>,
): z.infer<TSchema> {
  const parsed = schema.safeParse(source);
  if (parsed.success) {
    return parsed.data;
  }

  const invalidNames = new Set(parsed.error.issues.map((issue) => issue.path.join(".")));
  throw new Error(`Invalid environment variables: ${[...invalidNames].join(", ")}`);
}
