import type { z } from "zod";

import type { CapabilityKind, CapabilitySource } from "./capability.constants";
import type { Result, SharedErrorCode } from "../result";

/**
 * Trusted server context; access supplies permissions from SQL, never client input.
 */
export type CapabilityContext<
  Client = unknown,
  Permission extends string = string,
  Admin = unknown,
> = {
  readonly client: Client;
  readonly permissions: ReadonlySet<Permission>;
  readonly admin: Admin;
  readonly source: (typeof CapabilitySource)[keyof typeof CapabilitySource];
};

/**
 * The permission strings accepted by a concrete server context.
 */
type ContextPermission<Context extends CapabilityContext> =
  Context["permissions"] extends ReadonlySet<infer Permission extends string> ? Permission : never;

/**
 * A use case's metadata, authorization requirement, parser and implementation.
 */
export type CapabilityDefinition<
  Context extends CapabilityContext,
  InputSchema extends z.ZodType,
  Value,
  ErrorCode extends string,
> = {
  name: string;
  kind: (typeof CapabilityKind)[keyof typeof CapabilityKind];
  permission: ContextPermission<Context>;
  input: InputSchema;
  execute: (
    context: Context,
    input: z.output<InputSchema>,
  ) => Result<Value, ErrorCode> | Promise<Result<Value, ErrorCode>>;
};

/**
 * The only executable entry point exposed by a capability.
 */
export type Capability<Context extends CapabilityContext, Value, ErrorCode extends string> = {
  run: (context: Context, input: unknown) => Promise<Result<Value, ErrorCode | SharedErrorCode>>;
};
