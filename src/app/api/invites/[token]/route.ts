/**
 * GET    /api/invites/[token] → Validate token (public)
 * POST   /api/invites/[token] → Register user and consume token (public)
 * DELETE /api/invites/[token] → Revoke invite (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 410 });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 410 });
  }

  const body     = await req.json();
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const { salt, hash } = hashPassword(password);

  const [user] = await db.$transaction([
    db.user.create({ data: { username, passwordHash: hash, passwordSalt: salt } }),
    db.invite.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { token } = await params;

  try {
    await db.invite.delete({ where: { token } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
}
