/**
 * GET  /api/epics   → All epics
 * POST /api/epics   → Create new epic
 */
import { NextRequest, NextResponse } from "next/server";
import { getEpics, createEpic } from "@/lib/data";

export async function GET() {
  try {
    const epics = await getEpics();
    return NextResponse.json(epics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const epic = await createEpic({
      title:       body.title.trim(),
      description: body.description ?? "",
      color:       body.color       ?? "#5a8fd4",
      status:      body.status      ?? "active",
    });
    return NextResponse.json(epic, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
