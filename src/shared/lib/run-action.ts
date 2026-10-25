import "server-only";

import { unstable_rethrow } from "next/navigation";
import { randomUUID } from "node:crypto";

import { createLogger, type Logger } from "./logger";
import { err, type Result, type SharedErrorCode } from "./result";

/** Client-safe outcome with feature codes and shared boundary failures. */
export type ActionResult<T, E extends string = string> = Result<T, E | SharedErrorCode>;

function stackFrames(error: unknown): string {
  if (!(error instanceof Error)) return "";

  // Why: exception messages and arbitrary thrown payloads can contain credentials or input.
  return (error.stack ?? "")
    .split("\n")
    .filter((line) => /^\s+at /.test(line))
    .join("\n");
}

/**
 * Correlates action diagnostics and converts unexpected failures to a safe error code.
 * @param name Stable action name, never user input.
 * @param fn Operation returning expected failures as Results and logging named steps.
 * @returns The operation's result or an unexpected error.
 * @throws Next.js control-flow signals are rethrown for the framework to handle.
 */
export async function runAction<T, E extends string = string>(
  name: string,
  fn: (log: Logger) => Result<T, E> | Promise<Result<T, E>>,
): Promise<ActionResult<T, E>> {
  const log = createLogger({ action: name, correlationId: randomUUID() });
  const started = performance.now();
  let outcome = "interrupted";
  log.info("start");

  try {
    const result = await fn(log);
    outcome = result.ok ? "ok" : "error";
    return result;
  } catch (error) {
    unstable_rethrow(error);

    outcome = "unexpected";
    log.error("unexpected", { stack: stackFrames(error) });
    return err("unexpected");
  } finally {
    log.info("finish", { outcome, durationMs: performance.now() - started });
  }
}
