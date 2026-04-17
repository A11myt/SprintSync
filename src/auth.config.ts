import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:          string;
      role:        string;
      permissions: string[];
    } & import("next-auth").DefaultSession["user"];
  }
}

const PUBLIC_PATHS = ["/login", "/setup"];
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/sync",
  "/api/setup",       // first user creation (only when no users exist)
  "/api/invites/",    // invite acceptance (token in path)
  "/invite/",
];

// Edge-safe config: no Node.js modules, no DB calls.
// Used by middleware; the full auth.ts adds the Credentials provider on top.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;

      if (PUBLIC_PATHS.includes(pathname)) return true;
      if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true;

      // API routes: pass through — middleware handler returns 401
      if (pathname.startsWith("/api/")) return true;

      // Pages: NextAuth redirects to /login if false
      return !!auth;
    },
    jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = (user as any).role        ?? "member";
        token.permissions = (user as any).permissions ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (token.id)          session.user.id          = token.id          as string;
      if (token.role)        session.user.role        = token.role        as string;
      session.user.permissions = (token.permissions as string[]) ?? [];
      return session;
    },
  },
};
