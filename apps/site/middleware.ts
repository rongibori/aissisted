import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * apps/site — middleware
 *
 * Gates the Investor Room. Checks for a valid session cookie and, if absent
 * or expired, redirects to /request-access. Real session verification
 * (HMAC-signed token, 14-day default expiry via SITE_SESSION_EXPIRY) lands
 * in Milestone 7.
 *
 * This scaffold is a placeholder — it only inspects the cookie's presence.
 * Do NOT treat this as a security boundary until Milestone 7 replaces it.
 *
 * Preview bypass:
 *   · NEXT_PUBLIC_INVESTOR_ROOM_OPEN=1  · open the gate (Vercel preview review)
 *   · VERCEL_ENV=preview                 · automatically open on preview builds
 *
 * The production deploy (VERCEL_ENV=production) never matches either bypass
 * unless NEXT_PUBLIC_INVESTOR_ROOM_OPEN is explicitly set.
 */

const SESSION_COOKIE = "aissisted_site_session";

function isPreviewOpen(): boolean {
  if (process.env.NEXT_PUBLIC_INVESTOR_ROOM_OPEN === "1") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Guard gated surfaces only.
  if (!pathname.startsWith("/investor-room")) {
    return NextResponse.next();
  }

  // Preview / explicit-open bypass for Ron's review cycle.
  if (isPreviewOpen()) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;

  // Placeholder check — Milestone 7 validates signature + expiry.
  if (!session) {
    const loginUrl = new URL("/request-access", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/investor-room/:path*"],
};
