"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Task, Sprint, Epic } from "@/lib/data";
import { getCookie, setCookie } from "@/lib/cookies";
import { usePersistentFilter } from "@/hooks/usePersistentFilter";
import TaskDetailModal from "@/components/TaskDetailModal";

interface Props {
  initialTasks: Task[];
  sprints: Sprint[];
  epics: Epic[];
  users: string[];
}

const COLUMNS = [
  { id: "todo"        as const, label: "To Do",       dot: "bg-info" },
  { id: "in-progress" as const, label: "In Progress", dot: "bg-primary" },
  { id: "review"      as const, label: "Review",      dot: "bg-warning" },
  { id: "done"        as const, label: "Done",        dot: "bg-success" },
];

// ─── Task Card ────────────────────────────────────────────────

function TaskCard({
  task,
  epicMap,
  onDragStart,
  onOpenDetail,
}: {
  task: Task;
  epicMap: Record<string, Epic>;
  onDragStart: (id: string, status: Task["status"]) => void;
  onOpenDetail: (id: string) => void;
}) {
  const epic = task.epic ? epicMap[task.epic] : null;

  return (
    <div
      draggable
      data-id={task.id}
      data-status={task.status}
      data-epic={task.epic ?? ""}
      data-assignee={task.assignee ?? ""}
      data-priority={task.priority}
      onDragStart={() => onDragStart(task.id, task.status)}
      className="bg-surface border border-secondary border-l-2 border-l-outline
                 rounded-sm p-2.5 cursor-grab
                 hover:border-l-primary hover:shadow-[0_2px_12px_rgba(0,0,0,0.4)]
                 transition-all duration-100 select-none animate-card-in"
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="text-base leading-snug">{task.title}</span>
        <button
          onClick={e => { e.stopPropagation(); onOpenDetail(task.id); }}
          className="shrink-0 text-dim hover:text-primary text-[10px] mt-0.5
                     transition-colors leading-none bg-transparent border-0 cursor-pointer p-0"
        >
          ⤢
        </button>
      </div>
      {task.body && (
        <p className="text-[10px] text-dim leading-relaxed mb-2 line-clamp-2">
          {task.body}
        </p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`prio prio-${task.priority}`} />
        {task.estimate && (
          <span className="text-[9px] text-muted bg-overlay border border-divider px-1 rounded-[1px]">
            {task.estimate}pt
          </span>
        )}
        {epic && (
          <span className="text-[9px] truncate max-w-[80px]" style={{ color: epic.color }}>
            {epic.title}
          </span>
        )}
        {task.due && (
          <span className="text-[9px] text-orange ml-auto">{task.due.slice(5)}</span>
        )}
        {task.assignee && (
          <span className="text-[9px] text-dim ml-auto font-mono">
            @{task.assignee}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── New Task Modal ────────────────────────────────────────────

function NewTaskModal({
  epics,
  users,
  defaultStatus,
  onClose,
  onCreated,
}: {
  epics: Epic[];
  users: string[];
  defaultStatus: string;
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
      status:   fd.get("status") ?? defaultStatus,
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
              <label className="field-label">Status</label>
              <select name="status" defaultValue={defaultStatus} className="field-input">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="backlog">Backlog</option>
              </select>
            </div>
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
            <div className="field">
              <label className="field-label">Due</label>
              <input type="date" name="due" className="field-input" />
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

// ─── Main Board Client ─────────────────────────────────────────

export default function BoardClient({ initialTasks, sprints, epics, users }: Props) {
  const [tasks, setTasks]     = useState<Task[]>(initialTasks);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNew, setShowNew]   = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Sprint selection: lazy-initialise to the active sprint, then override with
  // any stored cookie value after mount (must stay separate from usePersistentFilter
  // because it needs a non-empty fallback that depends on props).
  const [selectedSprint, setSelectedSprint] = useState(
    () => sprints.find(s => s.status === "active")?.id ?? ""
  );
  useEffect(() => {
    const stored = getCookie("board_selectedSprint");
    if (stored) setSelectedSprint(stored);
  }, []);

  const [filterEpic,     setFilterEpic]     = usePersistentFilter("board_filterEpic");
  const [filterPriority, setFilterPriority] = usePersistentFilter("board_filterPriority");
  const [filterSearch,   setFilterSearch]   = useState("");

  // Stores the dragged task's id and previous status so a failed PATCH can be rolled back
  const dragState = useRef<{ id: string; status: Task["status"] } | null>(null);

  const epicMap = Object.fromEntries(epics.map(e => [e.id, e]));
  const activeSprint = selectedSprint && selectedSprint !== "__none__"
    ? sprints.find(s => s.id === selectedSprint) ?? null
    : null;

  const boardTasks = selectedSprint === "__none__"
    ? tasks.filter(t => !t.sprint && t.status !== "backlog")
    : selectedSprint
      ? tasks.filter(t => t.sprint === selectedSprint)
      : tasks.filter(t => t.status !== "backlog");

  const filteredTasks = boardTasks.filter(t => {
    if (filterEpic     && t.epic     !== filterEpic)     return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterSearch   && !t.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  // Triggered by AppLayout's keyboard shortcut
  useEffect(() => {
    const h = () => setShowNew(true);
    window.addEventListener("vaultboard:new-task", h);
    return () => window.removeEventListener("vaultboard:new-task", h);
  }, []);

  const handleDragStart = useCallback((id: string, status: Task["status"]) => {
    dragState.current = { id, status };
  }, []);

  const handleDrop = useCallback(async (colId: string) => {
    setDragOver(null);
    const drag = dragState.current;
    if (!drag) return;
    dragState.current = null;

    const { id, status: prevStatus } = drag;

    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: colId as Task["status"] } : t
    ));

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: colId }),
    });

    if (!res.ok) {
      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, status: prevStatus } : t
      ));
    }
  }, []);

  const handleTaskSaved = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const hasFilter = filterEpic || filterPriority || filterSearch;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3
                      border-b border-secondary bg-surface shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-md font-semibold tracking-tight">Board</h1>
          {activeSprint && (
            <span className="text-xs text-muted">
              {activeSprint.startDate} → {activeSprint.endDate}
            </span>
          )}
        </div>
        <button className="btn-ghost" onClick={() => setShowNew(true)}>
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
          value={selectedSprint}
          onChange={e => { setSelectedSprint(e.target.value); setCookie("board_selectedSprint", e.target.value); }}
          className="field-input py-1 text-2xs w-40"
        >
          <option value="">All tasks</option>
          <option value="__none__">— Kein Sprint —</option>
          {sprints.map(s => (
            <option key={s.id} value={s.id}>
              {s.title}{s.status === "active" ? " ●" : ""}
            </option>
          ))}
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
        <input
          type="text"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          placeholder="Search…"
          className="field-input py-1 text-2xs w-36"
        />
        {hasFilter && (
          <button
            className="btn-ghost py-1 text-2xs"
            onClick={() => { setFilterEpic(""); setFilterPriority(""); setFilterSearch(""); }}
          >
            ✕ Reset
          </button>
        )}
        <span className="ml-auto text-dim text-2xs">
          <kbd className="bg-surface border border-secondary px-1 rounded-[2px]">n</kbd> New Task
        </span>
      </div>

      {/* Columns */}
      <div className="flex overflow-x-auto snap-x snap-mandatory
                      md:grid md:grid-cols-4 md:snap-none md:flex-1 md:overflow-hidden
                      gap-px bg-divider pb-4 md:pb-0">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const isOver   = dragOver === col.id;
          return (
            <div
              key={col.id}
              data-col={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={e => {
                if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
                  setDragOver(null);
                }
              }}
              onDrop={() => handleDrop(col.id)}
              className={[
                "flex flex-col min-w-[260px] md:min-w-0 snap-start",
                "bg-background p-2 overflow-y-auto",
                "transition-colors duration-100",
                isOver ? "bg-accent" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-1.5 px-1 py-2 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <span className="label">{col.label}</span>
                <span className="text-xs text-muted ml-auto">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    epicMap={epicMap}
                    onDragStart={handleDragStart}
                    onOpenDetail={setDetailId}
                  />
                ))}
                {isOver && (
                  <div className="h-12 border border-dashed border-primary/40 rounded-sm" />
                )}
              </div>
            </div>
          );
        })}
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
          defaultStatus="todo"
          onClose={() => setShowNew(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
