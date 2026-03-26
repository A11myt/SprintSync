/**
 * GET    /api/tasks/[id]  → Single task
 * PATCH  /api/tasks/[id]  → Update fields (e.g. status for Kanban drag)
 * DELETE /api/tasks/[id]  → Archive task
 */
import { NextRequest, NextResponse } from "next/server";
import { getTask, updateTask, deleteTask } from "@/lib/data";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await getTask(id);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const task = await updateTask(id, body);
    return NextResponse.json(task);
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
    const session = await auth();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await deleteTask(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    const status = err.message?.includes("Record to update not found") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
