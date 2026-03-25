"use client";

import { useState, useCallback } from "react";
import type { Sprint, Task } from "@/lib/data";

interface Props {
  initialSprints: Sprint[];
  tasks: Task[];
  users: string[];
}

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
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

export default function SprintsClient({ initialSprints, tasks, users: _users }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [showNew, setShowNew] = useState(false);

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
    <div className="p-6 max-w-3xl">

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
              <div className="flex gap-1.5">
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
                <a href={`/board`} className="btn-ghost">Board →</a>
              </div>
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
    </div>
  );
}
