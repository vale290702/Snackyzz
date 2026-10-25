import type { z } from "zod";

import type { SignInFieldError } from "./sign-in.constants";
import type { signInInputSchema } from "./sign-in.schema";

/**
 * Parsed sign-in credentials.
 */
export type SignInInput = z.output<typeof signInInputSchema>;

/**
 * A field the sign-in form can flag.
 */
export type SignInField = keyof SignInInput;

/**
 * A field-level sign-in problem.
 */
export type SignInFieldErrorCode = (typeof SignInFieldError)[keyof typeof SignInFieldError];
