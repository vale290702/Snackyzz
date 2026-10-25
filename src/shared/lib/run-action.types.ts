import type { Logger } from "./logger.types";
import type { Result, SharedErrorCode } from "./result.types";
import type { ActionOutcome } from "./run-action.constants";

/** Client-safe outcome with feature codes and shared boundary failures. */
export type ActionResult<Value, ErrorCode extends string = string> = Result<
  Value,
  ErrorCode | SharedErrorCode
>;

/** Operation executed inside the action's diagnostic and failure boundary. */
export type ActionOperation<Value, ErrorCode extends string> = (
  log: Logger,
) => Result<Value, ErrorCode> | Promise<Result<Value, ErrorCode>>;

/** Outcome values emitted by the action wrapper. */
export type ActionOutcomeValue = (typeof ActionOutcome)[keyof typeof ActionOutcome];
