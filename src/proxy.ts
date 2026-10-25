import type { NextRequest } from "next/server";

import { refreshAdminSession } from "@/features/access";

/**
 * Keeps admin session cookies fresh; Server Components can't write the rotated refresh token.
 * @param request The incoming `/admin` request.
 * @returns The response, with refreshed cookies or a sign-in redirect.
 */
export function proxy(request: NextRequest) {
  return refreshAdminSession(request);
}

export const config = {
  matcher: "/admin/:path*",
};
