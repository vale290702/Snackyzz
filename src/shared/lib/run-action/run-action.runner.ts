import "server-only";

import { unstable_rethrow } from "next/navigation";
import { randomUUID } from "node:crypto";

import { ErrorDiagnostics } from "./error-diagnostics.helper";
import { ActionEvent, ActionOutcome } from "./run-action.constants";
import type { ActionOperation, ActionOutcomeValue, ActionResult } from "./run-action.types";
import { createLogger } from "../logger";
import { Results, SharedError } from "../result";

/**
 * Correlates action diagnostics and converts unexpected failures to a safe error code.
 * @param name Stable action name, never user input.
 * @param operation Operation returning expected failures as Results and logging named steps.
 * @returns The operation's result or an unexpected error.
 * @throws Next.js control-flow signals are rethrown for the framework to handle.
 */
export async function runAction<Value, ErrorCode extends string = string>(
  name: string,
  operation: ActionOperation<Value, ErrorCode>,
): Promise<ActionResult<Value, ErrorCode>> {
  const log = createLogger({ action: name, correlationId: randomUUID() });
  const started = performance.now();
  let outcome: ActionOutcomeValue = ActionOutcome.Interrupted;
  let errorCode: string | undefined;
  log.info(ActionEvent.Start);

  try {
    const result = await operation(log);
    outcome = result.ok ? ActionOutcome.Success : ActionOutcome.ExpectedFailure;
    if (!result.ok) errorCode = result.error;
    return result;
  } catch (error) {
    unstable_rethrow(error);

    outcome = ActionOutcome.UnexpectedFailure;
    errorCode = SharedError.Unexpected;
    log.error(ActionEvent.Unexpected, ErrorDiagnostics.describe(error));
    return Results.err(SharedError.Unexpected);
  } finally {
    log.info(ActionEvent.Finish, {
      outcome,
      durationMs: Math.round(performance.now() - started),
      ...(errorCode === undefined ? {} : { error: errorCode }),
    });
  }
}
