/**
 * GET  /api/users → List users (without hash/salt)
 * POST /api/users → Create user (invite flow only — direct creation is unused)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
      select:  { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    const count = await db.user.count();
    const role  = count === 0 ? "admin" : "member";

    const user = await db.user.create({
      data: { username, passwordHash: hash, passwordSalt: salt, role },
    });

    return NextResponse.json(
      { id: user.id, username: user.username, role: user.role },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
