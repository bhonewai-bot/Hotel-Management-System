import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const AUTH_PREFIX = "/api/auth";
const LOGIN_PATHS = ["/login", "/forgot-password", "/reset-password"];

function isLoginPath(pathname: string): boolean {
  return LOGIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Always let auth API routes through (sign-in, sign-out, OTP, etc.)
  if (pathname.startsWith(AUTH_PREFIX)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect authenticated users away from login pages
  if (session && isLoginPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!session && !isLoginPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
