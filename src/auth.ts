import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/auth-helpers";

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

        if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;

        return { id: user.id, name: user.username, role: user.role, permissions: user.permissions };
      },
    }),
  ],
});
