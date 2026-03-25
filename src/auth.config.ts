import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:   string;
      role: string;
    } & import("next-auth").DefaultSession["user"];
  }
}

// Edge-safe config: no Node.js modules, no DB calls.
// Used by middleware; the full auth.ts adds the Credentials provider on top.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "member";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id)   session.user.id   = token.id   as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },
};
