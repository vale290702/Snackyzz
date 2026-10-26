/**
 * Where a form stands after its latest submission.
 */
export const FormActionStatus = {
  Idle: "idle",
  Invalid: "invalid",
  Failed: "failed",
  Succeeded: "succeeded",
} as const;

/**
 * How a field's submitted entries become its raw schema value.
 */
export const FormFieldKind = {
  /**
   * The first entry, as submitted; missing becomes undefined.
   */
  Text: "text",
  /**
   * True when the field was submitted at all; an unchecked checkbox submits nothing.
   */
  Checkbox: "checkbox",
  /**
   * Every text entry in order, such as a checkbox group; none becomes an empty list.
   */
  List: "list",
} as const;
