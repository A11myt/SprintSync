import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBoardSettings, updateBoardSettings } from "@/lib/data";

export async function GET() {
  const settings = await getBoardSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session)                        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin")   return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const body    = await req.json();
  const updated = await updateBoardSettings(body);
  return NextResponse.json(updated);
}
