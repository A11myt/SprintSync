/**
 * GET  /api/notifications       → Notifications for the current user (newest first)
 * POST /api/notifications       → Mark all as read
 */
import { NextResponse } from "next/server";
import { getNotifications, markNotificationsRead } from "@/lib/data";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(await getNotifications(session.user.name!));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await markNotificationsRead(session.user.name!);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
