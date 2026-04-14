/**
 * PATCH  /api/users/[id] → Update role or password (admin only)
 * DELETE /api/users/[id] → Delete user (admin only, cannot delete self)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin, isNotFound } from "@/lib/auth-helpers";

type Role = "admin" | "member";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const body = await req.json();

  const data: { role?: Role; passwordHash?: string; passwordSalt?: string } = {};

  if (body.role !== undefined) {
    if (body.role !== "admin" && body.role !== "member") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const { salt, hash } = hashPassword(body.password);
    data.passwordHash = hash;
    data.passwordSalt = salt;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    if (isNotFound(err)) return NextResponse.json({ error: "User not found" }, { status: 404 });
    console.error("User update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;

  if (guard.session.user.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isNotFound(err)) return NextResponse.json({ error: "User not found" }, { status: 404 });
    console.error("User delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
