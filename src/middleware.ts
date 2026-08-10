import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Edge gate for the console.
 *
 * This is a fast redirect for humans, not the security boundary — it only
 * checks that the cookie is a well-formed, unexpired token. Every route handler
 * and server page re-checks the session against the database, so a revoked or
 * deactivated account cannot slip through on a still-valid token.
 */

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/admin/login",
  "/track",
  "/api/auth",
  "/api/track",
];

const PROTECTED_PREFIXES = ["/dashboard", "/book", "/orders", "/partners", "/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // The admin console is the admin's home; users have no business there.
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
