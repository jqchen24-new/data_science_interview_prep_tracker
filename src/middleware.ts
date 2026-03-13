import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/v1") || pathname === "/api/auth/token" || pathname === "/api/auth/google" || pathname === "/api/auth/apple";
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  if (isApiPath(pathname)) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    return NextResponse.next();
  }
  // Load NextAuth only when first needed so dev server doesn't hang on DB at startup
  const { withAuth } = await import("next-auth/middleware");
  const authMiddleware = withAuth({ pages: { signIn: "/signin" } });
  // NextRequest is correct at runtime; withAuth augments it. Cast satisfies TS (NextRequestWithAuth).
  return authMiddleware(request as Parameters<typeof authMiddleware>[0], event);
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/api/auth/token",
    "/api/auth/google",
    "/dashboard/:path*",
    "/plan/:path*",
    "/tasks/:path*",
    "/applications/:path*",
    "/mock-interview",
    "/mock-interview/:path*",
    "/progress/:path*",
    "/tags/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/",
  ],
};
