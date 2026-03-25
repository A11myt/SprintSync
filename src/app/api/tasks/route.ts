/**
 * GET  /api/tasks   → All tasks (filter: ?sprint=, ?status=, ?epic=)
 * POST /api/tasks   → Create new task
 */
import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/data";

export async function GET(req: NextRequest) {
  try {
    let tasks = await getTasks();

    const { searchParams } = req.nextUrl;
    const sprint = searchParams.get("sprint");
    const status = searchParams.get("status");
    const epic   = searchParams.get("epic");

    if (sprint) tasks = tasks.filter(t => t.sprint === sprint);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (epic)   tasks = tasks.filter(t => t.epic   === epic);

    return NextResponse.json(tasks);
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
    const task = await createTask({
      title:    body.title.trim(),
      status:   body.status   ?? "backlog",
      priority: body.priority ?? "medium",
      epic:     body.epic     ?? undefined,
      sprint:   body.sprint   ?? undefined,
      assignee: body.assignee ?? undefined,
      tags:     body.tags     ?? [],
      estimate: body.estimate ?? undefined,
      due:      body.due      ?? undefined,
      body:     body.body     ?? "",
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
