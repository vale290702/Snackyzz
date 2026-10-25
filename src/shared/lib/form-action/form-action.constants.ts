/**
 * Where a form stands after its latest submission.
 */
export const FormActionStatus = {
  Idle: "idle",
  Invalid: "invalid",
  Failed: "failed",
  Succeeded: "succeeded",
} as const;
