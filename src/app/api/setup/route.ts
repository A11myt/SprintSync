/**
 * POST /api/setup → Create the first admin user.
 * Blocked once any user exists in the database.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";

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

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
      .toString("hex");

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
