import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;

  // Always allow auth routes and sync endpoint (API key auth)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/sync")
  ) {
    return NextResponse.next();
  }

  // Login page — always allow
  if (pathname === "/login") return NextResponse.next();

  // Invite pages — always allow
  if (pathname.startsWith("/invite/")) return NextResponse.next();

  // Setup page — allow (server component handles redirect if users exist)
  if (pathname === "/setup") return NextResponse.next();

  // All other routes require session
  const session = (req as any).auth;
  if (!session) {
    // API routes → 401 JSON, pages → redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
