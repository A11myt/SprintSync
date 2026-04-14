import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Session } from "next-auth";

// ─── Password hashing ─────────────────────────────────────────

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// ─── Admin guard ──────────────────────────────────────────────

type AdminGuardOk  = { session: Session };
type AdminGuardErr = { response: NextResponse };

export async function requireAdmin(): Promise<AdminGuardOk | AdminGuardErr> {
  const session = await auth();
  if (!session)
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "admin")
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

// ─── Prisma error helpers ─────────────────────────────────────

/** Returns true when the error is a Prisma "record not found" error (P2025). */
export function isNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}
