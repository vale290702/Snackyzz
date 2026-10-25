import "server-only";

import type { z } from "zod";

import type { Capability, CapabilityContext, CapabilityDefinition } from "./capability.types";
import { Results } from "./result";
import { SharedError } from "./result.constants";

export { CapabilityKind, CapabilitySource } from "./capability.constants";
export type { Capability, CapabilityContext, CapabilityDefinition } from "./capability.types";

/**
 * Defines one use case whose entry point always authorizes before parsing.
 * @param definition Stable metadata, required permission, input schema and implementation.
 * @returns A runner accepting trusted server context and untrusted input.
 * @throws Bugs propagate to the action or job boundary.
 */
export function defineCapability<
  Context extends CapabilityContext,
  InputSchema extends z.ZodType,
  Value,
  ErrorCode extends string,
>(
  definition: CapabilityDefinition<Context, InputSchema, Value, ErrorCode>,
): Capability<Context, Value, ErrorCode> {
  return {
    async run(context, input) {
      if (!context.permissions.has(definition.permission)) {
        return Results.err(SharedError.Forbidden);
      }

      const parsed = await definition.input.safeParseAsync(input);
      if (!parsed.success) {
        return Results.err(SharedError.InvalidInput);
      }

      return definition.execute(context, parsed.data);
    },
  };
}
