/**
 * GET  /api/invites → List all invites (admin only)
 * POST /api/invites → Create a one-time invite link (admin only)
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const invites = await db.invite.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, usedAt: true, createdAt: true, expiresAt: true },
  });

  return NextResponse.json(invites);
}

export async function POST() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const token     = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await db.invite.create({ data: { token, expiresAt } });

  return NextResponse.json({ token, id: invite.id }, { status: 201 });
}
