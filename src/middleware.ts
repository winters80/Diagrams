import { NextRequest, NextResponse } from "next/server";

/**
 * Simple site-wide password gate (HTTP Basic Auth).
 *
 * Set SITE_USER and SITE_PASSWORD as environment variables to turn it on.
 * If either is unset (e.g. local dev), the gate is disabled and the site is open.
 *
 * This gates EVERYTHING — including the /api/generate route — so nobody can
 * spend your Claude credits without the password.
 */
export const config = {
  // Gate all routes except Next's build assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  const user = process.env.SITE_USER;
  const pass = process.env.SITE_PASSWORD;

  // Not configured → don't gate (open, e.g. during local development).
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Prompt to Diagram"' },
  });
}
