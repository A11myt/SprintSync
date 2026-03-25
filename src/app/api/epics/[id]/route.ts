/**
 * PATCH  /api/epics/[id]  → Update epic
 * DELETE /api/epics/[id]  → Delete epic (409 if tasks assigned)
 */
import { NextRequest, NextResponse } from "next/server";
import { updateEpic, deleteEpic, getTasks } from "@/lib/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const epic = await updateEpic(id, body);
    return NextResponse.json(epic);
  } catch (err: any) {
    const status = err.message?.includes("Record to update not found") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = (await getTasks()).filter(t => t.epic === id);
    if (tasks.length > 0) {
      return NextResponse.json(
        { error: `Epic still has ${tasks.length} task(s). Please reassign them first.` },
        { status: 409 }
      );
    }
    await deleteEpic(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    const status = err.message?.includes("Record to delete does not exist") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
