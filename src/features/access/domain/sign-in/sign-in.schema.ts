import { z } from "zod";

import { SignInFieldError } from "./sign-in.constants";

/**
 * Credentials an admin signs in with; issue messages are `SignInFieldError` codes, never copy.
 */
export const signInInputSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: SignInFieldError.EmailInvalid })),
  password: z.string().min(1, { error: SignInFieldError.PasswordRequired }),
});
