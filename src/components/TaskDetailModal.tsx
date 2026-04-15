"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Task, Sprint, Epic, Comment } from "@/lib/data";

interface Props {
  taskId: string;
  sprints: Sprint[];
  epics: Epic[];
  users: string[];
  onClose: () => void;
  onSaved: (task: Task) => void;
}

export default function TaskDetailModal({
  taskId,
  sprints,
  epics,
  users,
  onClose,
  onSaved,
}: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [task, setTask]       = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [comments, setComments]       = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [commenting, setCommenting]   = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(t => { setTask(t); setLoading(false); })
      .catch(() => { setError("Failed to load task"); setLoading(false); });

    fetch(`/api/tasks/${taskId}/comments`)
      .then(r => r.json())
      .then(setComments)
      .catch(() => {});
  }, [taskId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommenting(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ body: commentBody.trim() }),
    });
    setCommenting(false);
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setCommentBody("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
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

    onSaved(await res.json());
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onSaved({ ...task!, status: "backlog" } as Task);
    onClose();
  };

  const epicLabel   = task?.epic    ? epics.find(e => e.id === task.epic)?.title       ?? task.epic    : null;
  const sprintLabel = task?.sprint  ? sprints.find(s => s.id === task.sprint)?.title   ?? task.sprint  : null;

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal w-[min(560px,95vw)]">
        <div className="modal-header">
          <span className="label">{isEditing ? "Edit Task" : "Task"}</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-sm cursor-pointer
                       bg-transparent border-0 p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-muted">Loading…</div>
        )}

        {/* ── View mode ── */}
        {!loading && task && !isEditing && (
          <div className="flex flex-col gap-3">
            <div className="text-base font-medium leading-snug">{task.title}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span><span className="text-dim">Status</span> {task.status}</span>
              <span><span className="text-dim">Priority</span> {task.priority}</span>
              {task.estimate  && <span><span className="text-dim">Points</span> {task.estimate}</span>}
              {task.due       && <span><span className="text-dim">Due</span> {task.due}</span>}
              {task.assignee  && <span><span className="text-dim">Assignee</span> @{task.assignee}</span>}
              {epicLabel      && <span><span className="text-dim">Epic</span> {epicLabel}</span>}
              {sprintLabel    && <span><span className="text-dim">Sprint</span> {sprintLabel}</span>}
              {task.createdBy && <span><span className="text-dim">Created by</span> {task.createdBy}</span>}
            </div>
            {task.body && (
              <div className="field-input font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {task.body}
              </div>
            )}

            {/* Comments */}
            <div className="flex flex-col gap-2 pt-1 border-t border-secondary">
              <span className="label text-dim">
                Comments{comments.length > 0 && ` · ${comments.length}`}
              </span>
              {comments.map(c => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xs font-medium text-ink">@{c.author}</span>
                    <span className="text-[10px] text-dim">
                      {new Date(c.created).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex flex-col gap-1.5 mt-1">
                <textarea
                  ref={commentInputRef}
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment(e);
                  }}
                  rows={2}
                  placeholder="Add a comment…"
                  className="field-input resize-none text-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={commenting || !commentBody.trim()}
                    className="btn-primary py-1 text-xs"
                  >
                    {commenting ? "Posting…" : "Post"}
                  </button>
                  <span className="text-[10px] text-dim">⌘↵ to submit</span>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              {isAdmin && (
                <button type="button" onClick={handleDelete} className="btn-danger mr-auto">
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} className="btn-ghost">Close</button>
              <button type="button" onClick={() => setIsEditing(true)} className="btn-primary">Edit</button>
            </div>
          </div>
        )}

        {/* ── Edit mode ── */}
        {!loading && task && isEditing && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <label className="field-label">Title</label>
              <input type="text" name="title" defaultValue={task.title} className="field-input" required />
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
              <div className="field">
                <label className="field-label">Points</label>
                <input
                  type="number" name="estimate" defaultValue={task.estimate ?? ""}
                  className="field-input" placeholder="—" min="1" max="99"
                />
              </div>
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
                <input type="date" name="due" defaultValue={task.due ?? ""} className="field-input" />
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
                name="body" rows={5} defaultValue={task.body}
                className="field-input resize-y font-mono text-xs leading-relaxed"
                placeholder="Markdown supported…"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-footer">
              {isAdmin && (
                <button type="button" onClick={handleDelete} className="btn-danger mr-auto">
                  Delete
                </button>
              )}
              <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">Cancel</button>
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
