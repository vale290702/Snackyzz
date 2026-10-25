import { useTranslations } from "next-intl";

import { SharedError, type SharedErrorCode } from "@/shared/lib/result";

import type { Messages } from "./messages";

/**
 * A feature's key under `errors.json`.
 */
export type ErrorNamespace = Exclude<keyof Messages["errors"], "shared">;

/**
 * Every code with copy for a feature: its own codes plus the shared boundary codes.
 */
export type ErrorMessageCode<Namespace extends ErrorNamespace> =
  (keyof Messages["errors"][Namespace] & string) | SharedErrorCode;

const sharedErrorCodes: ReadonlySet<string> = new Set(Object.values(SharedError));

/**
 * Translates error codes from Server Actions and schemas into copy.
 * @param namespace The feature whose `errors.<namespace>` copy to use.
 * @returns A function from a code (or nothing) to its message (or null); shared codes read `errors.shared`.
 */
export function useErrorMessage<Namespace extends ErrorNamespace>(namespace: Namespace) {
  const translate = useTranslations("errors");

  return (code: ErrorMessageCode<Namespace> | null | undefined): string | null => {
    if (code === null || code === undefined) {
      return null;
    }

    const key = sharedErrorCodes.has(code) ? `shared.${code}` : `${namespace}.${code}`;

    // next-intl can't check a key built from a generic namespace; ErrorMessageCode already did.
    return translate(key as Parameters<typeof translate>[0]);
  };
}
