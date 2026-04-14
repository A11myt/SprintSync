/**
 * POST /api/setup → Create the first admin user.
 * Blocked once any user exists in the database.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const count = await db.user.count();
    if (count > 0) {
      return NextResponse.json({ error: "Setup already completed" }, { status: 403 });
    }

    const body = await req.json();
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const { salt, hash } = hashPassword(password);
    const user = await db.user.create({
      data: { username, passwordHash: hash, passwordSalt: salt, role: "admin" },
    });

    return NextResponse.json(
      { id: user.id, username: user.username, role: user.role },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
