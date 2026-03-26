import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/sync", "/api/users", "/api/invites/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!req.auth && pathname.startsWith("/api/")) {
    if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) return;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
