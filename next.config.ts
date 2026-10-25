import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  devIndicators: false,
  // Dev logs print Server Function arguments verbatim, which would include sign-in passwords.
  logging: { serverFunctions: false },
  experimental: {
    authInterrupts: true,
  },
};

export default withNextIntl(nextConfig);
