"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Sprint, Task, Epic, BoardSettings } from "@/lib/data";

interface Props {
  initialSprints: Sprint[];
  tasks:          Task[];
  epics:          Epic[];
  users:          string[];
  boardSettings?: BoardSettings;
}

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

// ─── Task Detail Modal ─────────────────────────────────────────

function TaskDetailModal({
  taskId,
  sprints,
  epics,
  users,
  onClose,
  onSaved,
  showStoryPoints = true,
}: {
  taskId: string;
  sprints: Sprint[];
  epics: Epic[];
  users: string[];
  onClose: () => void;
  onSaved: (task: Task) => void;
  showStoryPoints?: boolean;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(t => { setTask(t); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, any> = {
      title:    (fd.get("title") as string).trim(),
      status:   fd.get("status"),
      priority: fd.get("priority"),
      body:     fd.get("body") ?? "",
      epic:     fd.get("epic")     || undefined,
      sprint:   fd.get("sprint")   || undefined,
      assignee: fd.get("assignee") || undefined,
      due:      fd.get("due")      || undefined,
      estimate: fd.get("estimate") ? Number(fd.get("estimate")) : undefined,
    };

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save");
      return;
    }

    const saved = await res.json();
    onSaved(saved);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onSaved({ ...task!, status: "backlog" } as Task);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal w-[min(560px,95vw)]">
        <div className="modal-header">
          <span className="label">Edit Task</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-sm cursor-pointer
                       bg-transparent border-0 p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {loading && <div className="py-8 text-center text-xs text-muted">Loading…</div>}

        {!loading && task && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <label className="field-label">Title</label>
              <input
                type="text"
                name="title"
                defaultValue={task.title}
                className="field-input"
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="field">
                <label className="field-label">Status</label>
                <select name="status" defaultValue={task.status} className="field-input">
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Priority</label>
                <select name="priority" defaultValue={task.priority} className="field-input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              {showStoryPoints && (
                <div className="field">
                  <label className="field-label">Points</label>
                  <input
                    type="number"
                    name="estimate"
                    defaultValue={task.estimate ?? ""}
                    className="field-input"
                    placeholder="—"
                    min="1"
                    max="99"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <div className="field">
                <label className="field-label">Epic</label>
                <select name="epic" defaultValue={task.epic ?? ""} className="field-input">
                  <option value="">— no epic —</option>
                  {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Sprint</label>
                <select name="sprint" defaultValue={task.sprint ?? ""} className="field-input">
                  <option value="">— no sprint —</option>
                  {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Due</label>
                <input
                  type="date"
                  name="due"
                  defaultValue={task.due ?? ""}
                  className="field-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="field flex-1">
                <label className="field-label">Assignee</label>
                <select name="assignee" defaultValue={task.assignee ?? ""} className="field-input">
                  <option value="">— unassigned —</option>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {task.createdBy && (
                <div className="field flex-1">
                  <label className="field-label">Created by</label>
                  <div className="field-input text-muted">{task.createdBy}</div>
                </div>
              )}
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea
                name="body"
                rows={5}
                defaultValue={task.body}
                className="field-input resize-y font-mono text-xs leading-relaxed"
                placeholder="Markdown supported…"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-footer">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger mr-auto"
                >
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── New Sprint Modal ──────────────────────────────────────────

function NewSprintModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (sprint: Sprint) => void;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     (fd.get("title") as string).trim(),
        goal:      fd.get("goal"),
        startDate: fd.get("startDate"),
        endDate:   fd.get("endDate"),
        status:    "planned",
      }),
    });
    if (res.ok) {
      const sprint = await res.json();
      onCreated(sprint);
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="label">New Sprint</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-sm cursor-pointer
                       bg-transparent border-0 p-1 leading-none"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="field">
            <label className="field-label">Name *</label>
            <input
              type="text"
              name="title"
              className="field-input"
              placeholder="Sprint 1"
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label">Sprint Goal</label>
            <input
              type="text"
              name="goal"
              className="field-input"
              placeholder="What should be finished by end?"
            />
          </div>
          <div className="flex gap-2">
            <div className="field">
              <label className="field-label">Start *</label>
              <input type="date" name="startDate" className="field-input" />
            </div>
            <div className="field">
              <label className="field-label">End *</label>
              <input type="date" name="endDate" className="field-input" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Create Sprint</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Sprints Client ───────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  backlog:       "bg-dim",
  todo:          "bg-info",
  "in-progress": "bg-primary",
  review:        "bg-warning",
  done:          "bg-success",
};

const STATUS_LABEL: Record<string, string> = {
  backlog:       "Backlog",
  todo:          "To Do",
  "in-progress": "In Progress",
  review:        "Review",
  done:          "Done",
};

const PRIORITY_EMOJI: Record<string, string> = {
  urgent: "🔴",
  high:   "🟠",
  medium: "🟡",
  low:    "🔵",
};

function buildSprintMarkdown(sprint: Sprint, sprintTasks: Task[], epicMap: Record<string, Epic>): string {
  const now    = new Date().toISOString().split("T")[0];
  const total  = sprintTasks.length;
  const done   = sprintTasks.filter(t => t.status === "done").length;
  const points = sprintTasks.reduce((s, t) => s + (t.estimate ?? 0), 0);
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  const lines: string[] = [];

  // YAML frontmatter
  lines.push("---");
  lines.push(`title: "${sprint.title}"`);
  lines.push(`status: ${sprint.status}`);
  if (sprint.goal)      lines.push(`goal: "${sprint.goal.replace(/"/g, '\\"')}"`);
  if (sprint.startDate) lines.push(`start: ${sprint.startDate}`);
  if (sprint.endDate)   lines.push(`end: ${sprint.endDate}`);
  if (sprint.createdBy) lines.push(`created_by: ${sprint.createdBy}`);
  lines.push(`exported: ${now}`);
  lines.push(`tasks: ${total}`);
  lines.push(`points: ${points}`);
  lines.push(`completion: ${pct}%`);
  lines.push("---");
  lines.push("");

  // Title
  lines.push(`# ${sprint.title}`);
  lines.push("");

  if (sprint.goal) {
    lines.push(`> ${sprint.goal}`);
    lines.push("");
  }

  // Meta summary
  const datePart = [sprint.startDate, sprint.endDate].filter(Boolean).join(" → ");
  const meta = [
    `**Status:** ${sprint.status}`,
    datePart && `**Period:** ${datePart}`,
    `**Tasks:** ${done}/${total} done`,
    points > 0 && `**Points:** ${points}`,
    `**Completion:** ${pct}%`,
  ].filter(Boolean).join("  ·  ");
  lines.push(meta);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Tasks grouped by status
  const order = ["in-progress", "review", "todo", "done", "backlog"];
  const groups: Record<string, Task[]> = {};
  sprintTasks.forEach(t => { (groups[t.status] ??= []).push(t); });

  for (const status of order) {
    const group = groups[status];
    if (!group?.length) continue;

    lines.push(`## ${STATUS_LABEL[status] ?? status}`);
    lines.push("");

    for (const task of group) {
      const epic = task.epic ? epicMap[task.epic] : null;
      lines.push(`### ${PRIORITY_EMOJI[task.priority] ?? "•"} ${task.title}`);
      lines.push("");

      const meta: string[] = [
        `**Priority:** ${task.priority}`,
        task.estimate != null && `**Estimate:** ${task.estimate} pts`,
        task.assignee  && `**Assignee:** @${task.assignee}`,
        epic           && `**Epic:** ${epic.title}`,
        task.due       && `**Due:** ${task.due}`,
        task.tags?.length && `**Tags:** ${task.tags.join(", ")}`,
      ].filter(Boolean) as string[];

      meta.forEach(m => lines.push(`- ${m}`));

      if (task.body?.trim()) {
        lines.push("");
        lines.push(task.body.trim());
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SprintsClient({ initialSprints, tasks: initialTasks, epics, users, boardSettings }: Props) {
  const showComments    = boardSettings?.showComments    ?? true;
  const showStoryPoints = boardSettings?.showStoryPoints ?? true;
  const [sprints, setSprints]       = useState<Sprint[]>(initialSprints);
  const [tasks, setTasks]           = useState<Task[]>(initialTasks);
  const [showNew, setShowNew]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailId, setDetailId]     = useState<string | null>(null);

  const handleTaskSaved = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]));

  function sprintStats(sprintId: string) {
    const st   = tasks.filter(t => t.sprint === sprintId);
    const done = st.filter(t => t.status === "done");
    return {
      total:      st.length,
      done:       done.length,
      points:     st.reduce((s, t) => s + (t.estimate ?? 0), 0),
      donePoints: done.reduce((s, t) => s + (t.estimate ?? 0), 0),
    };
  }

  const handleAction = useCallback(async (sprintId: string, action: "activate" | "close") => {
    const patch: Record<string, any> = {};
    if (action === "activate") patch.status = "active";
    if (action === "close") { patch.status = "closed"; patch.moveOpenToBacklog = true; }

    const res = await fetch(`/api/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (res.ok) {
      const updated = await res.json();
      setSprints(prev => {
        let next = prev.map(s => s.id === sprintId ? updated : s);
        // If activating, deactivate all others
        if (action === "activate") {
          next = next.map(s => s.id !== sprintId && s.status === "active"
            ? { ...s, status: "planned" as const }
            : s
          );
        }
        return next;
      });
    }
  }, []);

  const handleCreated = useCallback((sprint: Sprint) => {
    setSprints(prev => [...prev, sprint]);
  }, []);

  return (
    <div className="w-full flex-1 overflow-y-auto">
    <div className="max-w-5xl mx-auto w-full p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-secondary">
        <h1 className="text-md font-semibold tracking-tight">Sprints</h1>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Sprint
        </button>
      </div>

      {/* Sprint list */}
      <div className="flex flex-col gap-2">
        {sprints.length === 0 && (
          <div className="border border-dashed border-outline rounded-sm p-16 text-center">
            <div className="text-3xl opacity-20 mb-3">⟳</div>
            <p className="text-xs text-muted">No sprints yet. Create your first one.</p>
          </div>
        )}

        {sprints.map(sprint => {
          const stats    = sprintStats(sprint.id);
          const pct      = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          const days     = sprint.endDate ? daysLeft(sprint.endDate) : null;
          const isActive = sprint.status === "active";

          return (
            <div
              key={sprint.id}
              className={[
                "bg-surface border border-secondary border-l-2 rounded-sm p-4",
                "transition-colors duration-150",
                isActive ? "border-l-primary" : "border-l-outline",
                sprint.status === "closed" ? "opacity-40" : "",
              ].join(" ")}
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-md font-medium">{sprint.title}</span>
                    <span className={`badge badge-${sprint.status}`}>
                      {sprint.status}
                    </span>
                  </div>
                  {sprint.goal && (
                    <div className="text-xs text-muted italic">"{sprint.goal}"</div>
                  )}
                  {sprint.createdBy && (
                    <div className="text-2xs text-dim mt-1">by {sprint.createdBy}</div>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-xs text-muted mb-1">
                    {sprint.startDate} → {sprint.endDate}
                  </div>
                  {isActive && days !== null && (
                    <div className={`text-xs ${days <= 2 ? "text-error" : "text-orange"}`}>
                      {days > 0 ? `${days}d remaining` : "Expired"}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-3">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted w-7 text-right shrink-0">{pct}%</span>
              </div>

              {/* Stats */}
              <div className="flex gap-5 mb-3">
                {[
                  { val: stats.total,      label: "Tasks",   color: "" },
                  { val: stats.done,       label: "Done",    color: "text-success" },
                  { val: stats.points,     label: "Points",  color: "" },
                  { val: stats.donePoints, label: "Done Pts",color: "text-success" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col gap-0.5">
                    <span className={`text-2xl font-bold leading-none tracking-[-1px] ${s.color}`}>
                      {s.val}
                    </span>
                    <span className="text-2xs text-muted tracking-[1px] uppercase">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-wrap">
                {sprint.status === "planned" && (
                  <button
                    className="btn-ghost"
                    onClick={() => handleAction(sprint.id, "activate")}
                  >
                    Start Sprint
                  </button>
                )}
                {isActive && (
                  <button
                    className="btn-ghost"
                    onClick={() => handleAction(sprint.id, "close")}
                  >
                    Close Sprint
                  </button>
                )}
                <a href="/board" className="btn-ghost">Board →</a>
                {stats.total > 0 && (
                  <button
                    className="btn-ghost"
                    onClick={() => setExpandedId(expandedId === sprint.id ? null : sprint.id)}
                  >
                    {expandedId === sprint.id ? "Hide Tasks" : `Tasks (${stats.total})`}
                  </button>
                )}
                <button
                  className="btn-ghost"
                  title="Download as Markdown (Notion / Obsidian)"
                  onClick={() => {
                    const sprintTasks = tasks.filter(t => t.sprint === sprint.id);
                    const md = buildSprintMarkdown(sprint, sprintTasks, epicMap);
                    const slug = sprint.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    downloadMarkdown(`${slug}.md`, md);
                  }}
                >
                  ↓ MD
                </button>
              </div>

              {/* Expandable task list */}
              {expandedId === sprint.id && (() => {
                const sprintTasks = tasks.filter(t => t.sprint === sprint.id);
                const groups: Record<string, Task[]> = {};
                sprintTasks.forEach(t => {
                  (groups[t.status] ??= []).push(t);
                });
                const order = ["in-progress", "review", "todo", "done", "backlog"];
                return (
                  <div className="mt-3 pt-3 border-t border-secondary">
                    {order.filter(s => groups[s]?.length).map(status => (
                      <div key={status} className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-dim"}`} />
                          <span className="text-2xs text-muted uppercase tracking-[1px]">
                            {status.replace("-", " ")}
                          </span>
                          <span className="text-2xs text-dim">{groups[status].length}</span>
                        </div>
                        <div className="flex flex-col gap-1 pl-3">
                          {groups[status].map(t => {
                            const epic = t.epic ? epicMap[t.epic] : null;
                            return (
                              <div key={t.id} className="flex items-center gap-2">
                                <span className={`prio prio-${t.priority} shrink-0`} />
                                <span className="text-2xs text-ink flex-1 truncate">{t.title}</span>
                                {epic && (
                                  <span
                                    className="text-2xs shrink-0 px-1.5 py-0.5 rounded-[2px]"
                                    style={{ color: epic.color, background: `${epic.color}22` }}
                                  >
                                    {epic.title}
                                  </span>
                                )}
                                {t.assignee && (
                                  <span className="text-2xs text-dim shrink-0">@{t.assignee}</span>
                                )}
                                <button
                                  onClick={() => setDetailId(t.id)}
                                  className="shrink-0 text-dim hover:text-primary text-[10px]
                                             bg-transparent border-0 cursor-pointer p-0
                                             transition-colors leading-none"
                                >
                                  ⤢
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* New Sprint Modal */}
      {showNew && (
        <NewSprintModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Task Detail Modal */}
      {detailId && (
        <TaskDetailModal
          key={detailId}
          taskId={detailId}
          sprints={sprints}
          epics={epics}
          users={users}
          onClose={() => setDetailId(null)}
          onSaved={handleTaskSaved}
          showStoryPoints={showStoryPoints}
        />
      )}
    </div>
    </div>
  );
}
