/**
 * PATCH /api/sprints/[id]  → Update sprint (activate / close)
 */
import { NextRequest, NextResponse } from "next/server";
import { getSprints, updateSprint, getTasks, updateTask, deleteTask } from "@/lib/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { moveOpenToBacklog, ...patch } = body;

    // When activating: deactivate any currently active sprint
    if (patch.status === "active") {
      const sprints = await getSprints();
      await Promise.all(
        sprints
          .filter(s => s.status === "active" && s.id !== id)
          .map(s => updateSprint(s.id, { status: "planned" }))
      );
    }

    // When closing: move open tasks back to backlog, archive done tasks
    if (patch.status === "closed" && moveOpenToBacklog) {
      const tasks = await getTasks();
      const sprintTasks = tasks.filter(t => t.sprint === id);
      await Promise.all([
        ...sprintTasks
          .filter(t => t.status !== "done")
          .map(t => updateTask(t.id, { status: "backlog", sprint: undefined })),
        ...sprintTasks
          .filter(t => t.status === "done")
          .map(t => deleteTask(t.id)),
      ]);
    }

    const sprint = await updateSprint(id, patch);
    return NextResponse.json(sprint);
  } catch (err: any) {
    const status = err.message?.includes("Record to update not found") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
