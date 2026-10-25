/** Action lifecycle messages serialized in diagnostics. */
export const ActionEvent = {
  Start: "start",
  Finish: "finish",
  Unexpected: "unexpected",
} as const;

/** Outcomes recorded when an action finishes or yields to Next.js. */
export const ActionOutcome = {
  Success: "ok",
  ExpectedFailure: "error",
  UnexpectedFailure: "unexpected",
  Interrupted: "interrupted",
} as const;
