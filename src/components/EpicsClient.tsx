"use client";

import { useState, useCallback } from "react";
import type { Epic, Task, Sprint } from "@/lib/data";

interface Props {
  initialEpics: Epic[];
  tasks:        Task[];
  sprints:      Sprint[];
}

const PRESET_COLORS = [
  "#5a8fd4", "#8a6acc", "#d45a5a", "#d4843a",
  "#d4b85a", "#5ab88a", "#5ab8b8", "#d45a9a",
  "#7a8aaa", "#ff8000",
];

// ─── Epic Modal (Create + Edit) ────────────────────────────────

function EpicModal({
  edit,
  onClose,
  onSaved,
}: {
  edit?: Epic;
  onClose: () => void;
  onSaved: (epic: Epic) => void;
}) {
  const [color, setColor] = useState(edit?.color ?? "#5a8fd4");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    if (!title) { setError("Please enter a name"); return; }

    const payload = {
      title,
      description: (fd.get("description") as string).trim(),
      color,
      status:      fd.get("status"),
    };

    const res = edit
      ? await fetch(`/api/epics/${edit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/epics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Error");
      return;
    }

    const epic = await res.json();
    onSaved(epic);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal w-[min(480px,95vw)]">
        <div className="modal-header">
          <span className="label">{edit ? "Edit Epic" : "New Epic"}</span>
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
              defaultValue={edit?.title ?? ""}
              placeholder="Feature name or theme"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <textarea
              name="description"
              rows={3}
              className="field-input resize-none"
              defaultValue={edit?.description ?? ""}
              placeholder="Goal and scope of this epic…"
            />
          </div>

          <div className="field">
            <label className="field-label">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform cursor-pointer"
                  style={{
                    background: c,
                    borderColor: color === c ? c : "transparent",
                    transform:   color === c ? "scale(1.15)" : "",
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-5 h-5 rounded-full cursor-pointer border-0 bg-transparent p-0"
                title="Custom color"
              />
              <span className="text-2xs text-muted font-mono ml-1">{color}</span>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Status</label>
            <select
              name="status"
              defaultValue={edit?.status ?? "active"}
              className="field-input"
            >
              <option value="active">Active</option>
              <option value="done">Done</option>
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">
              {edit ? "Save" : "Create Epic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Epics Client ─────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  backlog:     "Backlog",
  todo:        "To Do",
  "in-progress": "In Progress",
  review:      "Review",
  done:        "Done",
};

export default function EpicsClient({ initialEpics, tasks, sprints }: Props) {
  const [epics, setEpics]           = useState<Epic[]>(initialEpics);
  const [showNew, setShowNew]       = useState(false);
  const [editEpic, setEditEpic]     = useState<Epic | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sprintMap = Object.fromEntries(sprints.map(s => [s.id, s]));

  function epicStats(epicId: string) {
    const et   = tasks.filter(t => t.epic === epicId);
    const done = et.filter(t => t.status === "done");
    return {
      total:   et.length,
      done:    done.length,
      open:    et.filter(t => t.status !== "done" && t.status !== "backlog").length,
      backlog: et.filter(t => t.status === "backlog").length,
      points:  et.reduce((s, t) => s + (t.estimate ?? 0), 0),
      pct:     et.length > 0 ? Math.round((done.length / et.length) * 100) : 0,
    };
  }

  const handleSaved = useCallback((epic: Epic) => {
    setEpics(prev => {
      const idx = prev.findIndex(e => e.id === epic.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = epic;
        return next;
      }
      return [...prev, epic];
    });
  }, []);

  const handleDelete = useCallback(async (epicId: string) => {
    if (!confirm("Delete this epic?")) return;
    const res = await fetch(`/api/epics/${epicId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Error deleting epic");
      return;
    }
    setEpics(prev => prev.filter(e => e.id !== epicId));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-secondary">
        <div className="flex items-baseline gap-3">
          <h1 className="text-md font-semibold tracking-tight">Epics</h1>
          <span className="text-xs text-muted">{epics.length} total</span>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + Epic
        </button>
      </div>

      {/* Empty state */}
      {epics.length === 0 && (
        <div className="border border-dashed border-outline rounded-sm p-16 text-center">
          <div className="text-3xl opacity-20 mb-3">◎</div>
          <p className="text-xs text-muted mb-4">
            No epics yet. Group related tasks into epics.
          </p>
          <button className="btn-ghost" onClick={() => setShowNew(true)}>
            + Create first Epic
          </button>
        </div>
      )}

      {/* Epic list */}
      <div className="flex flex-col gap-2">
        {epics.map(epic => {
          const s = epicStats(epic.id);
          return (
            <div
              key={epic.id}
              className="bg-surface border border-secondary border-l-[3px] rounded-sm p-4
                         transition-colors duration-150"
              style={{ borderLeftColor: epic.color }}
            >
              <div className="flex items-start gap-3">
                {/* Color swatch */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-[2px]"
                  style={{ background: epic.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-md font-medium">{epic.title}</span>
                    <span className={`badge ${epic.status === "done" ? "badge-done" : "badge-active"}`}>
                      {epic.status}
                    </span>
                  </div>

                  {epic.description && (
                    <div className="text-xs text-muted mb-3 leading-relaxed">
                      {epic.description}
                    </div>
                  )}

                  {/* Progress */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="progress-track">
                      <div
                        className="h-full rounded-none transition-all duration-500"
                        style={{ width: `${s.pct}%`, background: epic.color }}
                      />
                    </div>
                    <span className="text-xs text-muted shrink-0 w-7 text-right">{s.pct}%</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 flex-wrap">
                    {[
                      { val: s.total,   label: "Tasks" },
                      { val: s.done,    label: "Done" },
                      { val: s.open,    label: "Active" },
                      { val: s.backlog, label: "Backlog" },
                      { val: s.points,  label: "Points" },
                    ].map(stat => (
                      <div key={stat.label} className="flex flex-col gap-0.5">
                        <span className="text-xl font-bold leading-none tracking-[-1px]">
                          {stat.val}
                        </span>
                        <span className="text-2xs text-muted tracking-[1px] uppercase">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                    <div className="ml-auto flex gap-1.5 items-center">
                      {s.total > 0 && (
                        <button
                          className="btn-ghost py-1"
                          onClick={() => setExpandedId(expandedId === epic.id ? null : epic.id)}
                        >
                          {expandedId === epic.id ? "Hide Tasks" : "Show Tasks"}
                        </button>
                      )}
                      <button
                        className="btn-ghost py-1"
                        onClick={() => setEditEpic(epic)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger py-1"
                        onClick={() => handleDelete(epic.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expandable task list */}
                  {expandedId === epic.id && (
                    <div className="mt-3 pt-3 border-t border-secondary">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="label text-left pb-1.5 font-normal w-full">Task</th>
                            <th className="label text-left pb-1.5 font-normal whitespace-nowrap hidden sm:table-cell px-2">Status</th>
                            <th className="label text-left pb-1.5 font-normal whitespace-nowrap hidden md:table-cell px-2">Sprint</th>
                            <th className="label text-left pb-1.5 font-normal whitespace-nowrap px-2">Prio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.filter(t => t.epic === epic.id).map(t => {
                            const sprint = t.sprint ? sprintMap[t.sprint] : null;
                            return (
                              <tr key={t.id} className="border-t border-secondary">
                                <td className="py-1.5 pr-2">
                                  <span className="text-2xs text-ink">{t.title}</span>
                                </td>
                                <td className="py-1.5 px-2 hidden sm:table-cell">
                                  <span className={`badge badge-${t.status === "done" ? "done" : t.status === "in-progress" ? "active" : "planned"} text-2xs`}>
                                    {STATUS_LABEL[t.status] ?? t.status}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 hidden md:table-cell">
                                  {sprint ? (
                                    <span className="text-2xs text-primary">{sprint.title}</span>
                                  ) : (
                                    <span className="text-2xs text-dim">—</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-2">
                                  <span className={`prio prio-${t.priority}`} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showNew && (
        <EpicModal
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Edit Modal */}
      {editEpic && (
        <EpicModal
          edit={editEpic}
          onClose={() => setEditEpic(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
