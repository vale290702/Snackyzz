import "server-only";

import type { z } from "zod";

import { err, type Result, type SharedErrorCode } from "./result";

/** Trusted server context; access supplies permissions from SQL, never from client input. */
export type CapabilityContext<Client = unknown, P extends string = string, Admin = unknown> = {
  readonly client: Client;
  readonly permissions: ReadonlySet<P>;
  readonly admin: Admin;
  readonly source: "admin_web" | "messaging";
};

type Definition<C extends CapabilityContext, S extends z.ZodType, T, E extends string> = {
  name: string;
  kind: "query" | "mutation";
  permission: C["permissions"] extends ReadonlySet<infer P extends string> ? P : never;
  input: S;
  execute: (context: C, input: z.output<S>) => Result<T, E> | Promise<Result<T, E>>;
};

/**
 * Defines one use case whose entry point always authorizes before parsing.
 * @param definition Stable metadata, required permission, input schema and implementation.
 * @returns A runner accepting trusted server context and untrusted input.
 * @throws Bugs propagate to the action or job boundary.
 */
export function defineCapability<
  C extends CapabilityContext,
  S extends z.ZodType,
  T,
  E extends string,
>(
  definition: Definition<C, S, T, E>,
): { run: (context: C, input: unknown) => Promise<Result<T, E | SharedErrorCode>> } {
  return {
    async run(context, input) {
      if (!context.permissions.has(definition.permission)) {
        return err("forbidden");
      }

      const parsed = await definition.input.safeParseAsync(input);
      if (!parsed.success) {
        return err("invalid_input");
      }

      return definition.execute(context, parsed.data);
    },
  };
}
