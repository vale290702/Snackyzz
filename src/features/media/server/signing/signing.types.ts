import type { SigningScope } from "./signing.constants";

/**
 * What a signature is for.
 */
export type SigningScopeValue = (typeof SigningScope)[keyof typeof SigningScope];
