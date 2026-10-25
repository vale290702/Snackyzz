/**
 * How long a Supabase request may take before it is aborted.
 */
export const SUPABASE_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Wraps `fetch` so every Supabase request is aborted after a fixed timeout, keeping any caller signal.
 * @param input Request URL or object.
 * @param init Request options, possibly with the caller's own abort signal.
 * @returns The provider's response.
 */
export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;

  return fetch(input, {
    ...init,
    signal,
  });
}
