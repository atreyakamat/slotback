import { NextResponse, type NextRequest } from "next/server";

// Mirrors SESSION_COOKIE in src/server/auth/session.ts, which this edge file can't import.
const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-slotback_session" : "slotback_session";

/**
 * Optimistic check only: sends visitors without a session cookie to /login.
 * Real authorization happens in the data access layer (src/server/auth/dal.ts).
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/poster"],
};
