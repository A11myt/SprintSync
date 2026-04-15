/**
 * GET  /api/tasks/[id]/comments  → List comments for a task
 * POST /api/tasks/[id]/comments  → Add a comment + notify assignee/creator
 */
import { NextRequest, NextResponse } from "next/server";
import { getComments, createComment, getTask } from "@/lib/data";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    return NextResponse.json(await getComments(id));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }   = await params;
    const { body } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

    const author  = session.user.name!;
    const comment = await createComment(id, author, body.trim());

    // Notify assignee and creator (skip the commenter themselves)
    const task = await getTask(id);
    if (task) {
      const recipients = [...new Set([task.assignee, task.createdBy])]
        .filter((u): u is string => !!u && u !== author);

      if (recipients.length > 0) {
        await db.notification.createMany({
          data: recipients.map(recipient => ({
            recipient,
            taskId:        task.id,
            taskTitle:     task.title,
            commentAuthor: author,
            commentBody:   body.trim(),
          })),
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
