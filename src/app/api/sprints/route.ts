/**
 * GET  /api/sprints   → All sprints
 * POST /api/sprints   → Create new sprint
 */
import { NextRequest, NextResponse } from "next/server";
import { getSprints, createSprint } from "@/lib/data";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sprints = await getSprints();
    return NextResponse.json(sprints);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const sprint = await createSprint({
      title:     body.title.trim(),
      goal:      body.goal      ?? "",
      startDate: body.startDate ?? "",
      endDate:   body.endDate   ?? "",
      status:    body.status    ?? "planned",
      createdBy: session?.user?.name ?? undefined,
    });
    return NextResponse.json(sprint, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
