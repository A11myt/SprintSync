import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

// Extend session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials?.username as string)?.trim();
        const password = credentials?.password as string;
        if (!username || !password) return null;

        const user = await db.user.findUnique({ where: { username } });
        if (!user) return null;

        const hash = crypto
          .pbkdf2Sync(password, user.passwordSalt, 100_000, 64, "sha512")
          .toString("hex");

        const match = crypto.timingSafeEqual(
          Buffer.from(hash),
          Buffer.from(user.passwordHash)
        );

        if (!match) return null;
        return { id: user.id, name: user.username };
      },
    }),
  ],
});
