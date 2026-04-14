"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Task, Epic, Sprint } from "@/lib/data";

interface Props {
  initialTasks: Task[];
  epics:        Epic[];
  sprints:      Sprint[];
  activeSprint: Sprint | null;
  users:        string[];
}

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

// ─── Quick-Add Modal ───────────────────────────────────────────

function QuickAddModal({
  epics,
  sprints,
  users,
  defaultSprintId,
  onClose,
  onCreated,
}: {
  epics:          Epic[];
  sprints:        Sprint[];
  users:          string[];
  defaultSprintId?: string;
  onClose:        () => void;
  onCreated:      (task: Task) => void;
}) {
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd    = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    if (!title) { setError("Please enter a title"); return; }

    const payload: Record<string, unknown> = {
      title,
      status:   fd.get("sprint") ? "todo" : "backlog",
      priority: fd.get("priority") ?? "medium",
      tags:     [],
    };
    if (fd.get("sprint"))   payload.sprint   = fd.get("sprint");
    if (fd.get("epic"))     payload.epic     = fd.get("epic");
    if (fd.get("assignee")) payload.assignee = fd.get("assignee");
    if (fd.get("estimate")) payload.estimate = Number(fd.get("estimate"));
    if (fd.get("due"))      payload.due      = fd.get("due");

    const res  = await fetch("/api/tasks", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const task = await res.json();
    if (!res.ok) { setError(task.error ?? "Error"); return; }
    onCreated(task);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal w-[min(520px,95vw)]">
        <div className="modal-header">
          <span className="label">Quick Add Task</span>
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
            <label className="field-label">Title *</label>
            <input
              type="text"
              name="title"
              className="field-input"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="field">
              <label className="field-label">Priority</label>
              <select name="priority" defaultValue="medium" className="field-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Points</label>
              <input
                type="number"
                name="estimate"
                className="field-input"
                placeholder="—"
                min="1"
                max="99"
              />
            </div>
            <div className="field">
              <label className="field-label">Due</label>
              <input type="date" name="due" className="field-input" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="field flex-1">
              <label className="field-label">Sprint</label>
              <select name="sprint" defaultValue={defaultSprintId ?? ""} className="field-input">
                <option value="">— no sprint —</option>
                {sprints.filter(s => s.status !== "closed").map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div className="field flex-1">
              <label className="field-label">Epic</label>
              <select name="epic" className="field-input">
                <option value="">— no epic —</option>
                {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Assignee</label>
            <select name="assignee" className="field-input">
              <option value="">— unassigned —</option>
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard Client ──────────────────────────────────────────

export default function DashboardClient({
  initialTasks,
  epics,
  sprints,
  activeSprint,
  users,
}: Props) {
  const [tasks, setTasks]   = useState<Task[]>(initialTasks);
  const [showNew, setShowNew] = useState(false);

  const handleCreated = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  useEffect(() => {
    const h = () => setShowNew(true);
    window.addEventListener("vaultboard:new-task", h);
    return () => window.removeEventListener("vaultboard:new-task", h);
  }, []);

  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]));

  // ── Stats ──────────────────────────────────────────────────
  const today             = new Date().toISOString().slice(0, 10);
  const sprintTasks       = activeSprint ? tasks.filter(t => t.sprint === activeSprint.id) : [];
  const doneTasks         = sprintTasks.filter(t => t.status === "done");
  const pct               = sprintTasks.length > 0
    ? Math.round((doneTasks.length / sprintTasks.length) * 100)
    : 0;
  const dueTodayOrOverdue = tasks.filter(t => t.due && t.due <= today && t.status !== "done");
  const inProgress        = tasks.filter(t => t.status === "in-progress");
  const backlogCount      = tasks.filter(t => t.status === "backlog").length;
  const days              = activeSprint?.endDate ? daysLeft(activeSprint.endDate) : null;

  // ── Workload ───────────────────────────────────────────────
  const openTasks = tasks.filter(t => t.status !== "done" && t.status !== "backlog");
  const workloadMap: Record<string, number> = {};
  openTasks.forEach(t => {
    const key = t.assignee ?? "__unassigned__";
    workloadMap[key] = (workloadMap[key] ?? 0) + 1;
  });
  const workloadEntries = Object.entries(workloadMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxLoad         = workloadEntries[0]?.[1] ?? 1;

  return (
    <>
      <div className="p-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-divider">
          <div className="flex items-baseline gap-3">
            <h1 className="text-md font-semibold tracking-tight">Dashboard</h1>
            <span className="text-2xs text-muted">{today}</span>
          </div>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            + Task
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

          {/* Active Sprint — spans 2 cols */}
          <div className="card col-span-1 sm:col-span-2 p-4">
            <span className="label block mb-3">Active Sprint</span>
            {activeSprint ? (
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-md font-medium">{activeSprint.title}</div>
                  {days !== null && (
                    <span className={`text-xs shrink-0 ${
                      days <= 0 ? "text-error" : days <= 3 ? "text-orange" : "text-muted"
                    }`}>
                      {days > 0 ? `${days}d left` : "Expired"}
                    </span>
                  )}
                </div>
                {activeSprint.goal && (
                  <div className="text-xs text-muted italic mb-3">"{activeSprint.goal}"</div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {doneTasks.length}/{sprintTasks.length}
                  </span>
                </div>
                {activeSprint.startDate && activeSprint.endDate && (
                  <div className="text-2xs text-dim mb-3">
                    {activeSprint.startDate} → {activeSprint.endDate}
                  </div>
                )}
                <Link href="/board" className="text-2xs text-primary hover:opacity-70">
                  Open Board →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>No active sprint.</span>
                <Link href="/sprints" className="text-primary">Create Sprint →</Link>
              </div>
            )}
          </div>

          {/* Backlog */}
          <div className="card p-4">
            <span className="label block mb-3">Backlog</span>
            <div className="text-[40px] font-bold leading-none tracking-[-2px] mb-3 text-muted">
              {backlogCount}
            </div>
            <Link href="/backlog" className="text-2xs text-primary hover:opacity-70">
              Manage →
            </Link>
          </div>

          {/* In Progress */}
          <div className="card p-4">
            <span className="label block mb-3">In Progress</span>
            <div className="text-[40px] font-bold leading-none tracking-[-2px] mb-3">
              {inProgress.length}
            </div>
            <div className="flex flex-col gap-1">
              {inProgress.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span className={`prio prio-${t.priority}`} />
                  <span className="text-2xs text-muted truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Due / Overdue */}
          <div className="card p-4">
            <span className="label block mb-3">Due / Overdue</span>
            <div className={[
              "text-[40px] font-bold leading-none tracking-[-2px] mb-3",
              dueTodayOrOverdue.length > 0 ? "text-error" : "text-muted",
            ].join(" ")}>
              {dueTodayOrOverdue.length}
            </div>
            <div className="flex flex-col gap-1">
              {dueTodayOrOverdue.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span className="text-2xs text-orange shrink-0">{t.due?.slice(5)}</span>
                  <span className="text-2xs text-muted truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Workload */}
          <div className="card p-4">
            <span className="label block mb-3">Team Workload</span>
            {workloadEntries.length === 0 ? (
              <span className="text-xs text-muted">No active tasks.</span>
            ) : (
              <div className="flex flex-col gap-2">
                {workloadEntries.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-2xs text-muted w-20 truncate shrink-0">
                      {name === "__unassigned__" ? "—unassigned" : `@${name}`}
                    </span>
                    <div className="flex-1 h-1.5 bg-background rounded-none overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-none transition-all duration-500"
                        style={{ width: `${Math.round((count / maxLoad) * 100)}%` }}
                      />
                    </div>
                    <span className="text-2xs text-muted w-4 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Epics */}
          <div className="card col-span-1 sm:col-span-2 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="label">Epics</span>
              <Link href="/epics" className="text-2xs text-primary hover:opacity-70">
                All Epics →
              </Link>
            </div>
            {epics.length === 0 ? (
              <span className="text-xs text-muted">
                None yet. <Link href="/epics" className="text-primary">Create →</Link>
              </span>
            ) : (
              <div className="flex flex-col gap-2.5">
                {epics.filter(e => e.status === "active").map(epic => {
                  const et = tasks.filter(t => t.epic === epic.id);
                  const ed = et.filter(t => t.status === "done").length;
                  const p  = et.length > 0 ? Math.round((ed / et.length) * 100) : 0;
                  const activeCnt = et.filter(t => t.status === "in-progress" || t.status === "review").length;
                  return (
                    <div key={epic.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: epic.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-2xs mb-1 truncate">{epic.title}</div>
                        <div className="progress-track">
                          <div
                            className="h-full rounded-none transition-all duration-500"
                            style={{ width: `${p}%`, background: epic.color }}
                          />
                        </div>
                      </div>
                      <span className="text-2xs text-muted w-7 text-right shrink-0">{p}%</span>
                      {activeCnt > 0 && (
                        <span className="text-2xs text-primary shrink-0">{activeCnt} active</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {showNew && (
        <QuickAddModal
          epics={epics}
          sprints={sprints}
          users={users}
          defaultSprintId={activeSprint?.id}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
