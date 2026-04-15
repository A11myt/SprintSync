/**
 * data.ts
 * Async data-access layer backed by Prisma / PostgreSQL.
 */

import { db } from "./db";

// ─── Types ────────────────────────────────────────────────────

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type Priority   = "low" | "medium" | "high" | "urgent";

export interface Task {
  id:        string;
  title:     string;
  status:    TaskStatus;
  priority:  Priority;
  epic?:     string;
  sprint?:   string;
  assignee?: string;
  createdBy?: string;
  tags:      string[];
  estimate?: number;
  due?:      string;
  created:   string;
  updated:   string;
  body:      string;
}

export interface Sprint {
  id:        string;
  title:     string;
  goal:      string;
  startDate: string;
  endDate:   string;
  status:    "planned" | "active" | "closed";
  createdBy?: string;
  tasks:     string[];
}

export interface Comment {
  id:      string;
  taskId:  string;
  author:  string;
  body:    string;
  created: string;
}

export interface Notification {
  id:            string;
  taskId:        string;
  taskTitle:     string;
  commentAuthor: string;
  commentBody:   string;
  read:          boolean;
  created:       string;
}

export interface Epic {
  id:          string;
  title:       string;
  description: string;
  color:       string;
  status:      "active" | "done";
}

// ─── Users ────────────────────────────────────────────────────

export async function getUsers(): Promise<string[]> {
  const users = await db.user.findMany({ orderBy: { username: "asc" }, select: { username: true } });
  return users.map(u => u.username);
}

// ─── Task helpers ─────────────────────────────────────────────

export function toTask(row: any): Task {
  return {
    id:        row.id,
    title:     row.title,
    status:    row.status as TaskStatus,
    priority:  row.priority as Priority,
    epic:      row.epicId    ?? undefined,
    sprint:    row.sprintId  ?? undefined,
    assignee:  row.assignee  ?? undefined,
    createdBy: row.createdBy ?? undefined,
    tags:      row.tags ?? [],
    estimate:  row.estimate ?? undefined,
    due:       row.due ?? undefined,
    created:   row.createdAt.toISOString(),
    updated:   row.updatedAt.toISOString(),
    body:      row.body ?? "",
  };
}

export function toSprint(row: any): Sprint {
  return {
    id:        row.id,
    title:     row.title,
    goal:      row.goal ?? "",
    startDate: row.startDate ?? "",
    endDate:   row.endDate ?? "",
    status:    row.status as Sprint["status"],
    createdBy: row.createdBy ?? undefined,
    tasks:     (row.tasks ?? []).map((t: any) => t.id),
  };
}

export function toEpic(row: any): Epic {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? "",
    color:       row.color ?? "#888",
    status:      row.status as Epic["status"],
  };
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-äöüß]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 50);
}

// ─── Tasks ────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const rows = await db.task.findMany({
    where:   { archived: false },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toTask);
}

export async function getTask(id: string): Promise<Task | null> {
  const row = await db.task.findUnique({ where: { id } });
  return row && !row.archived ? toTask(row) : null;
}

export async function createTask(
  data: Omit<Task, "id" | "created" | "updated">
): Promise<Task> {
  const row = await db.task.create({
    data: {
      title:     data.title,
      status:    data.status,
      priority:  data.priority,
      epicId:    data.epic       ?? null,
      sprintId:  data.sprint     ?? null,
      assignee:  data.assignee   ?? null,
      createdBy: data.createdBy  ?? null,
      tags:      data.tags ?? [],
      estimate:  data.estimate   ?? null,
      due:       data.due        ?? null,
      body:      data.body       ?? "",
    },
  });
  return toTask(row);
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "created">>
): Promise<Task> {
  const row = await db.task.update({
    where: { id },
    data: {
      ...(patch.title     !== undefined && { title:    patch.title }),
      ...(patch.status    !== undefined && { status:   patch.status }),
      ...(patch.priority  !== undefined && { priority: patch.priority }),
      ...(patch.epic      !== undefined && { epicId:   patch.epic ?? null }),
      ...(patch.sprint    !== undefined && { sprintId: patch.sprint ?? null }),
      ...(patch.assignee  !== undefined && { assignee: patch.assignee ?? null }),
      ...(patch.tags      !== undefined && { tags:     patch.tags }),
      ...(patch.estimate  !== undefined && { estimate: patch.estimate ?? null }),
      ...(patch.due       !== undefined && { due:      patch.due ?? null }),
      ...(patch.body      !== undefined && { body:     patch.body }),
    },
  });
  return toTask(row);
}

export async function deleteTask(id: string): Promise<void> {
  await db.task.update({ where: { id }, data: { archived: true } });
}

// ─── Comments ─────────────────────────────────────────────────

export async function getComments(taskId: string): Promise<Comment[]> {
  const rows = await db.comment.findMany({
    where:   { taskId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(r => ({
    id:      r.id,
    taskId:  r.taskId,
    author:  r.author,
    body:    r.body,
    created: r.createdAt.toISOString(),
  }));
}

export async function createComment(
  taskId: string,
  author: string,
  body:   string,
): Promise<Comment> {
  const row = await db.comment.create({
    data: { taskId, author, body },
  });
  return {
    id:      row.id,
    taskId:  row.taskId,
    author:  row.author,
    body:    row.body,
    created: row.createdAt.toISOString(),
  };
}

// ─── Notifications ────────────────────────────────────────────

function toNotification(r: any): Notification {
  return {
    id:            r.id,
    taskId:        r.taskId,
    taskTitle:     r.taskTitle,
    commentAuthor: r.commentAuthor,
    commentBody:   r.commentBody,
    read:          r.read,
    created:       r.createdAt.toISOString(),
  };
}

export async function getNotifications(recipient: string): Promise<Notification[]> {
  const rows = await db.notification.findMany({
    where:   { recipient },
    orderBy: { createdAt: "desc" },
    take:    30,
  });
  return rows.map(toNotification);
}

export async function markNotificationsRead(recipient: string): Promise<void> {
  await db.notification.updateMany({
    where: { recipient, read: false },
    data:  { read: true },
  });
}

// ─── Sprints ──────────────────────────────────────────────────

export async function getSprints(): Promise<Sprint[]> {
  const rows = await db.sprint.findMany({
    include: { tasks: { where: { archived: false }, select: { id: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map(toSprint);
}

export async function getActiveSprint(): Promise<Sprint | null> {
  const row = await db.sprint.findFirst({
    where:   { status: "active" },
    include: { tasks: { where: { archived: false }, select: { id: true } } },
  });
  return row ? toSprint(row) : null;
}

export async function createSprint(
  data: Omit<Sprint, "id" | "tasks">
): Promise<Sprint> {
  const count = await db.sprint.count();
  const id    = `sprint-${String(count + 1).padStart(2, "0")}`;
  const row   = await db.sprint.create({
    data: {
      id,
      title:     data.title,
      goal:      data.goal      ?? "",
      startDate: data.startDate ?? "",
      endDate:   data.endDate   ?? "",
      status:    data.status    ?? "planned",
      createdBy: data.createdBy ?? null,
    },
    include: { tasks: { where: { archived: false }, select: { id: true } } },
  });
  return toSprint(row);
}

export async function updateSprint(
  id: string,
  patch: Partial<Omit<Sprint, "id" | "tasks">>
): Promise<Sprint> {
  const row = await db.sprint.update({
    where: { id },
    data: {
      ...(patch.title     !== undefined && { title:     patch.title }),
      ...(patch.goal      !== undefined && { goal:      patch.goal }),
      ...(patch.startDate !== undefined && { startDate: patch.startDate }),
      ...(patch.endDate   !== undefined && { endDate:   patch.endDate }),
      ...(patch.status    !== undefined && { status:    patch.status }),
    },
    include: { tasks: { where: { archived: false }, select: { id: true } } },
  });
  return toSprint(row);
}

// ─── Epics ────────────────────────────────────────────────────

export async function getEpics(): Promise<Epic[]> {
  const rows = await db.epic.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toEpic);
}

export async function createEpic(
  data: Omit<Epic, "id">
): Promise<Epic> {
  const id  = slugify(data.title);
  const row = await db.epic.create({
    data: {
      id,
      title:       data.title,
      description: data.description ?? "",
      color:       data.color  ?? "#5a8fd4",
      status:      data.status ?? "active",
    },
  });
  return toEpic(row);
}

export async function updateEpic(
  id: string,
  patch: Partial<Omit<Epic, "id">>
): Promise<Epic> {
  const row = await db.epic.update({
    where: { id },
    data: {
      ...(patch.title       !== undefined && { title:       patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.color       !== undefined && { color:       patch.color }),
      ...(patch.status      !== undefined && { status:      patch.status }),
    },
  });
  return toEpic(row);
}

export async function deleteEpic(id: string): Promise<void> {
  await db.epic.delete({ where: { id } });
}
