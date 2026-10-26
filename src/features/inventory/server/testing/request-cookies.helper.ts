/**
 * In-memory stand-ins for Next request state, for integration tests that call Server Actions
 * outside a request. Kept free of imports so `vi.mock` factories can load it.
 */
export class RequestCookies {
  private constructor() {}

  private static readonly jar = new Map<string, string>();

  /**
   * Forgets every cookie, signing the test request out.
   */
  static clear(): void {
    RequestCookies.jar.clear();
  }

  /**
   * A replacement for `next/headers` backed by the in-memory jar.
   * @returns The module shape the Supabase server client reads and writes.
   */
  static headersModule() {
    const jar = RequestCookies.jar;

    return {
      cookies: async () => ({
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        set: (name: string, value: string, options?: { maxAge?: number }) => {
          if (value === "" || options?.maxAge === 0) {
            jar.delete(name);
            return;
          }

          jar.set(name, value);
        },
      }),
    };
  }
}
