import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/courses", "/api/auth", "/api/trpc", "/api/inngest", "/api/health", "/api/upload", "/help"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

// In-memory rate limiter — sufficient for single-instance dev/staging.
// TODO (Production): Replace with Redis/Upstash for multi-instance deployments.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute for auth

function isRateLimited(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }
  return false;
}

// Periodically clean up expired entries (avoid memory leak)
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60_000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, CLEANUP_INTERVAL).unref?.();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/images")) {
    // Rate limit auth endpoints even though they're "public"
    if (pathname.startsWith("/api/auth")) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (isRateLimited(`auth:${ip}`, RATE_LIMIT_MAX_REQUESTS)) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rate limit API routes for authenticated users
  if (pathname.startsWith("/api/trpc")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`api:${ip}`, 100)) { // 100 req/min for API
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }
  }

  // Role-based guards using a lightweight role cookie.
  // The "user-role" cookie is set by the auth session callback (see lib/auth.ts).
  // Actual enforcement happens server-side in tRPC procedures — this is just
  // a fast-path UX guard to redirect users to the correct dashboard.
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/teacher")) {
    const roleCookie = request.cookies.get("user-role");
    const role = roleCookie?.value;

    if (role) {
      if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/student", request.url));
      }

      if (pathname.startsWith("/dashboard/teacher") && role !== "TEACHER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/student", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
