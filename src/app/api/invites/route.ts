/**
 * POST /api/invites → Create a one-time invite link (auth required)
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token     = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.invite.create({ data: { token, expiresAt } });

  return NextResponse.json({ token }, { status: 201 });
}
