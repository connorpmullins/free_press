import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Route Protection Configuration
// ============================================================

// Routes that require any authentication
const PROTECTED_ROUTES = [
  "/journalist",
  "/admin",
  "/settings",
  "/bookmarks",
];

// Routes that require specific roles
const JOURNALIST_ROUTES = ["/journalist"];
const ADMIN_ROUTES = ["/admin"];

// API routes that require authentication (all non-public)
const PROTECTED_API_ROUTES = [
  "/api/bookmarks",
  "/api/corrections",
  "/api/disputes",
  "/api/flags",
  "/api/profile",
  "/api/subscribe",
  "/api/admin",
];

// ============================================================
// Security Headers
// ============================================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs these
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

// ============================================================
// Middleware
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (lightweight check - actual session validation happens in API)
  const sessionCookie = request.cookies.get("fp_session");
  const isAuthenticated = !!sessionCookie?.value;

  // ============================================================
  // Protected page routes
  // ============================================================

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // ============================================================
  // Protected API routes
  // ============================================================

  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApi && !isAuthenticated) {
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    );
  }

  // ============================================================
  // API mutation protection (CSRF-like)
  // ============================================================
  // For state-changing API requests, ensure they come from our origin
  const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(
    request.method
  );
  const isApiRoute = pathname.startsWith("/api/");
  const isWebhook = pathname.startsWith("/api/webhooks/");

  if (isMutation && isApiRoute && !isWebhook) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Allow requests with no origin (server-side, curl, etc.) in development
    if (origin && host) {
      const originUrl = new URL(origin);
      const expectedHost = host.split(":")[0];
      const originHost = originUrl.hostname;

      if (originHost !== expectedHost && originHost !== "localhost") {
        return addSecurityHeaders(
          NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 }
          )
        );
      }
    }
  }

  // ============================================================
  // Apply security headers to all responses
  // ============================================================

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
