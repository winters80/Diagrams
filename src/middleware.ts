import { NextRequest, NextResponse } from "next/server";

/**
 * Site-wide password gate (HTTP Basic Auth) supporting multiple accounts.
 *
 * Configure via environment variables:
 *   SITE_USER + SITE_PASSWORD   — a single (admin) account.
 *   SITE_USERS                  — additional accounts, comma-separated
 *                                 "user:pass" pairs, e.g.
 *                                 "guest:lookaround,leon:s3cret".
 *
 * You can use either or both. If NONE are set (e.g. local dev) the gate is off.
 * Passwords may contain colons but not commas (comma separates accounts).
 *
 * This gates EVERYTHING — including /api/generate — so nobody can spend your
 * Claude credits without a valid login.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function validCredentials(): Map<string, string> {
  const users = new Map<string, string>();

  const singleUser = process.env.SITE_USER;
  const singlePass = process.env.SITE_PASSWORD;
  if (singleUser && singlePass) users.set(singleUser, singlePass);

  const list = process.env.SITE_USERS;
  if (list) {
    for (const pair of list.split(",")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx === -1) continue;
      const u = trimmed.slice(0, idx).trim();
      const p = trimmed.slice(idx + 1);
      if (u) users.set(u, p);
    }
  }

  return users;
}

export function middleware(req: NextRequest) {
  const users = validCredentials();

  // No credentials configured → don't gate.
  if (users.size === 0) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (users.get(u) === p) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Prompt to Diagram"' },
  });
}
