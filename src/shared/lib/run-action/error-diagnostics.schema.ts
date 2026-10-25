import { z } from "zod";

import { ErrorDiagnostic } from "./error-diagnostics.constants";

/**
 * Only bounded identifiers are eligible for diagnostic logs; unknown SQLSTATE is explicit.
 */
export const errorIdentifiersSchema = z.object({
  name: z.string().regex(ErrorDiagnostic.NamePattern).catch(ErrorDiagnostic.UnknownName),
  code: z.string().regex(ErrorDiagnostic.SqlStatePattern).nullable().catch(null),
});
