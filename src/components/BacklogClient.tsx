"use client";

import { useState, useCallback, useEffect } from "react";
import type { Task, Sprint, Epic } from "@/lib/data";
import { usePersistentFilter } from "@/hooks/usePersistentFilter";
import TaskDetailModal from "@/components/TaskDetailModal";

interface Props {
  initialTasks: Task[];
  sprints: Sprint[];
  epics: Epic[];
  users: string[];
}

// ─── New Task Modal ────────────────────────────────────────────

function NewTaskModal({
  epics,
  users,
  onClose,
  onCreated,
}: {
  epics: Epic[];
  users: string[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    if (!title) { setError("Please enter a title"); return; }

    const payload: Record<string, unknown> = {
      title,
      status:   "backlog",
      priority: fd.get("priority") ?? "medium",
      tags:     [],
    };
    if (fd.get("epic"))     payload.epic     = fd.get("epic");
    if (fd.get("assignee")) payload.assignee = fd.get("assignee");
    if (fd.get("estimate")) payload.estimate = Number(fd.get("estimate"));
    if (fd.get("due"))      payload.due      = fd.get("due");

    const res  = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      <div className="modal">
        <div className="modal-header">
          <span className="label">New Task</span>
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
              type="text" name="title" className="field-input"
              placeholder="What needs to be done?" autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="field">
              <label className="field-label">Priority</label>
              <select name="priority" defaultValue="medium" className="field-input">
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Points</label>
              <input
                type="number" name="estimate" className="field-input"
                placeholder="—" min="1" max="99"
              />
            </div>
            <div className="field">
              <label className="field-label">Due</label>
              <input type="date" name="due" className="field-input" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="field">
              <label className="field-label">Epic</label>
              <select name="epic" className="field-input">
                <option value="">— no epic —</option>
                {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Assignee</label>
              <select name="assignee" className="field-input">
                <option value="">— unassigned —</option>
                {users.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
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

// ─── Main Backlog Client ───────────────────────────────────────

export default function BacklogClient({ initialTasks, sprints, epics, users }: Props) {
  const [tasks, setTasks]       = useState<Task[]>(initialTasks);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNew, setShowNew]   = useState(false);

  const [filterEpic,     setFilterEpic]     = usePersistentFilter("backlog_filterEpic");
  const [filterPriority, setFilterPriority] = usePersistentFilter("backlog_filterPriority");

  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]));

  const filteredTasks = tasks.filter(t => {
    if (t.status !== "backlog")                    return false;
    if (filterEpic     && t.epic     !== filterEpic)     return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const handleTaskSaved = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  // Triggered by AppLayout's keyboard shortcut
  useEffect(() => {
    const h = () => setShowNew(true);
    window.addEventListener("vaultboard:new-task", h);
    return () => window.removeEventListener("vaultboard:new-task", h);
  }, []);

  const hasFilter = filterEpic || filterPriority;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3
                      border-b border-secondary bg-surface shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-md font-semibold tracking-tight">Backlog</h1>
          <span className="text-xs text-muted">{filteredTasks.length} tasks</span>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-secondary
                      bg-background shrink-0 overflow-x-auto scrollbar-none">
        <span className="text-2xs text-dim mr-1">Filter</span>
        <select
          value={filterEpic}
          onChange={e => setFilterEpic(e.target.value)}
          className="field-input py-1 text-2xs w-32"
        >
          <option value="">All Epics</option>
          {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="field-input py-1 text-2xs w-28"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {hasFilter && (
          <button
            className="btn-ghost py-1 text-2xs"
            onClick={() => { setFilterEpic(""); setFilterPriority(""); }}
          >
            ✕ Reset
          </button>
        )}
        <span className="ml-auto text-dim text-2xs">
          <kbd className="bg-surface border border-secondary px-1 rounded-[2px]">n</kbd> New Task
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-3xl opacity-20">≡</div>
            <p className="text-xs text-muted">Backlog is empty.</p>
            <button className="btn-ghost" onClick={() => setShowNew(true)}>
              + Create Task
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-secondary bg-surface sticky top-0">
                <th className="label text-left px-5 py-2 font-normal w-full">Title</th>
                <th className="label text-left px-3 py-2 font-normal whitespace-nowrap">Prio</th>
                <th className="label text-left px-3 py-2 font-normal whitespace-nowrap hidden sm:table-cell">Epic</th>
                <th className="label text-left px-3 py-2 font-normal whitespace-nowrap hidden md:table-cell">Assignee</th>
                <th className="label text-left px-3 py-2 font-normal whitespace-nowrap hidden md:table-cell">Points</th>
                <th className="label text-left px-3 py-2 font-normal whitespace-nowrap hidden md:table-cell">Due</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const epic = task.epic ? epicMap[task.epic] : null;
                return (
                  <tr
                    key={task.id}
                    className="border-b border-secondary hover:bg-surface
                               transition-colors duration-75 cursor-pointer"
                    onClick={() => setDetailId(task.id)}
                  >
                    <td className="px-5 py-2.5">
                      <span className="text-base">{task.title}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`prio prio-${task.priority}`} />
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      {epic ? (
                        <span className="text-2xs" style={{ color: epic.color }}>{epic.title}</span>
                      ) : (
                        <span className="text-dim text-2xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {task.assignee
                        ? <span className="text-2xs text-muted">@{task.assignee}</span>
                        : <span className="text-dim text-2xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-2xs text-muted hidden md:table-cell">
                      {task.estimate ? `${task.estimate}pt` : <span className="text-dim">—</span>}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {task.due ? (
                        <span className="text-2xs text-orange">{task.due.slice(5)}</span>
                      ) : (
                        <span className="text-dim text-2xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={e => { e.stopPropagation(); setDetailId(task.id); }}
                        className="text-dim hover:text-primary text-[10px]
                                   bg-transparent border-0 cursor-pointer p-0 transition-colors"
                      >
                        ⤢
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detailId && (
        <TaskDetailModal
          key={detailId}
          taskId={detailId}
          sprints={sprints}
          epics={epics}
          users={users}
          onClose={() => setDetailId(null)}
          onSaved={handleTaskSaved}
        />
      )}

      {showNew && (
        <NewTaskModal
          epics={epics}
          users={users}
          onClose={() => setShowNew(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
