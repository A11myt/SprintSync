/**
 * POST /api/sync
 * Obsidian plugin calls this endpoint to sync markdown vault data.
 * Authenticated via x-api-key header (not session cookie).
 *
 * Payload: { tasks?, sprints?, epics? }
 * Each array contains full objects — upsert semantics (create or update by id).
 *
 * GET /api/sync
 * Export all data for Obsidian plugin to pull.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function authorized(req: NextRequest): boolean {
  const key = process.env.SYNC_API_KEY;
  if (!key) return false;
  return req.headers.get("x-api-key") === key;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const results: Record<string, number> = { tasks: 0, sprints: 0, epics: 0 };

  // ── Epics first (tasks reference them) ──
  if (Array.isArray(body.epics)) {
    for (const e of body.epics) {
      if (!e.id || !e.title) continue;
      await db.epic.upsert({
        where:  { id: e.id },
        update: {
          title:       e.title,
          description: e.description ?? "",
          color:       e.color  ?? "#888",
          status:      e.status ?? "active",
        },
        create: {
          id:          e.id,
          title:       e.title,
          description: e.description ?? "",
          color:       e.color  ?? "#888",
          status:      e.status ?? "active",
        },
      });
      results.epics++;
    }
  }

  // ── Sprints ──
  if (Array.isArray(body.sprints)) {
    for (const s of body.sprints) {
      if (!s.id || !s.title) continue;
      await db.sprint.upsert({
        where:  { id: s.id },
        update: {
          title:     s.title,
          goal:      s.goal      ?? "",
          startDate: s.startDate ?? "",
          endDate:   s.endDate   ?? "",
          status:    s.status    ?? "planned",
        },
        create: {
          id:        s.id,
          title:     s.title,
          goal:      s.goal      ?? "",
          startDate: s.startDate ?? "",
          endDate:   s.endDate   ?? "",
          status:    s.status    ?? "planned",
        },
      });
      results.sprints++;
    }
  }

  // ── Tasks ──
  if (Array.isArray(body.tasks)) {
    for (const t of body.tasks) {
      if (!t.id || !t.title) continue;
      await db.task.upsert({
        where:  { id: t.id },
        update: {
          title:    t.title,
          status:   t.status   ?? "backlog",
          priority: t.priority ?? "medium",
          epicId:   t.epic     ?? null,
          sprintId: t.sprint   ?? null,
          assignee: t.assignee ?? null,
          tags:     Array.isArray(t.tags) ? t.tags : [],
          estimate: t.estimate ?? null,
          due:      t.due      ?? null,
          body:     t.body     ?? "",
        },
        create: {
          id:       t.id,
          title:    t.title,
          status:   t.status   ?? "backlog",
          priority: t.priority ?? "medium",
          epicId:   t.epic     ?? null,
          sprintId: t.sprint   ?? null,
          assignee: t.assignee ?? null,
          tags:     Array.isArray(t.tags) ? t.tags : [],
          estimate: t.estimate ?? null,
          due:      t.due      ?? null,
          body:     t.body     ?? "",
        },
      });
      results.tasks++;
    }
  }

  return NextResponse.json({ ok: true, synced: results });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tasks, sprints, epics] = await Promise.all([
    db.task.findMany({ where: { archived: false }, orderBy: { createdAt: "desc" } }),
    db.sprint.findMany({ orderBy: { id: "asc" } }),
    db.epic.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({
    tasks: tasks.map(t => ({
      id:       t.id,
      title:    t.title,
      status:   t.status,
      priority: t.priority,
      epic:     t.epicId   ?? undefined,
      sprint:   t.sprintId ?? undefined,
      assignee: t.assignee ?? undefined,
      tags:     t.tags,
      estimate: t.estimate ?? undefined,
      due:      t.due ?? undefined,
      body:     t.body,
      created:  t.createdAt.toISOString(),
      updated:  t.updatedAt.toISOString(),
    })),
    sprints: sprints.map(s => ({
      id:        s.id,
      title:     s.title,
      goal:      s.goal,
      startDate: s.startDate,
      endDate:   s.endDate,
      status:    s.status,
    })),
    epics: epics.map(e => ({
      id:          e.id,
      title:       e.title,
      description: e.description,
      color:       e.color,
      status:      e.status,
    })),
  });
}
