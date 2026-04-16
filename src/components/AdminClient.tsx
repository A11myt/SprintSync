"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

type Role = "admin" | "member";

interface User {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
}

interface Invite {
  id: string;
  token: string;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string;
}

interface BoardSettings {
  showStoryPoints: boolean;
  showComments:    boolean;
}

interface Props {
  initialUsers: User[];
  initialInvites: Invite[];
  currentUserId: string;
  initialBoardSettings: BoardSettings;
}

// ─── Password Reset Modal ──────────────────────────────────────

function PasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [error, setError] = useState("");
  const [done, setDone]   = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onClose, 1200);
    return () => clearTimeout(t);
  }, [done, onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd       = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm  = fd.get("confirm")  as string;

    if (password.length < 6)    { setError("Min. 6 characters"); return; }
    if (password !== confirm)   { setError("Passwords don't match"); return; }

    const res = await fetch(`/api/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Error");
      return;
    }

    setDone(true);
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal w-[min(400px,95vw)]">
        <div className="modal-header">
          <span className="label">Reset Password — {user.username}</span>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-sm cursor-pointer bg-transparent border-0 p-1 leading-none"
          >
            ✕
          </button>
        </div>
        {done ? (
          <div className="py-6 text-center text-xs text-primary">Password updated.</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <label className="field-label">New Password</label>
              <input type="password" name="password" className="field-input" autoFocus minLength={6} required />
            </div>
            <div className="field">
              <label className="field-label">Confirm</label>
              <input type="password" name="confirm" className="field-input" required />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Set Password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── InviteSection ─────────────────────────────────────────────

function InviteSection({
  title,
  invites,
  onRevoke,
}: {
  title: string;
  invites: Invite[];
  onRevoke?: (invite: Invite) => void;
}) {
  if (invites.length === 0) return null;
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-2xs text-muted mb-1.5 uppercase tracking-widest">{title}</div>
      {invites.map(invite => (
        <InviteRow key={invite.id} invite={invite} onRevoke={onRevoke} />
      ))}
    </div>
  );
}

// ─── InviteRow ─────────────────────────────────────────────────

function InviteRow({
  invite,
  onRevoke,
}: {
  invite: Invite;
  onRevoke?: (invite: Invite) => void;
}) {
  const [copied, setCopied] = useState(false);

  const isUsed    = !!invite.usedAt;
  const isActive  = !isUsed && new Date(invite.expiresAt) > new Date();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
    setCopied(true);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface border border-secondary rounded-sm mb-1
                    hover:border-outline transition-colors">
      <code className="text-2xs font-mono text-muted flex-1 truncate">
        {invite.token.slice(0, 16)}…
      </code>
      <span className="text-2xs text-muted hidden sm:block shrink-0">
        {new Date(invite.expiresAt).toLocaleDateString()}
      </span>
      {isUsed && invite.usedAt && (
        <span className="text-2xs text-dim shrink-0">
          used {new Date(invite.usedAt).toLocaleDateString()}
        </span>
      )}
      {isActive && (
        <button onClick={copyLink} className="btn-ghost py-0.5 text-2xs shrink-0">
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
      {!isUsed && onRevoke && (
        <button onClick={() => onRevoke(invite)} className="btn-danger py-0.5 text-2xs shrink-0">
          Revoke
        </button>
      )}
    </div>
  );
}

// ─── Main AdminClient ──────────────────────────────────────────

export default function AdminClient({ initialUsers, initialInvites, currentUserId, initialBoardSettings }: Props) {
  const [tab, setTab]             = useState<"users" | "board">("users");
  const [users, setUsers]         = useState<User[]>(initialUsers);
  const [invites, setInvites]     = useState<Invite[]>(initialInvites);
  const [pwUser, setPwUser]       = useState<User | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [boardSettings, setBoardSettings] = useState<BoardSettings>(initialBoardSettings);
  const [boardSaving, setBoardSaving]     = useState(false);
  const [boardSaved, setBoardSaved]       = useState(false);

  const saveBoardSettings = useCallback(async (patch: Partial<BoardSettings>) => {
    setBoardSaving(true);
    setBoardSaved(false);
    const next = { ...boardSettings, ...patch };
    setBoardSettings(next);
    const res = await fetch("/api/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    });
    setBoardSaving(false);
    if (res.ok) {
      setBoardSaved(true);
      setTimeout(() => setBoardSaved(false), 2000);
    }
  }, [boardSettings]);

  useEffect(() => {
    if (!inviteCopied) return;
    const t = setTimeout(() => setInviteCopied(false), 2500);
    return () => clearTimeout(t);
  }, [inviteCopied]);

  const { activeInvites, usedInvites, expiredInvites } = useMemo(() => {
    const now = new Date();
    return invites.reduce<{ activeInvites: Invite[]; usedInvites: Invite[]; expiredInvites: Invite[] }>(
      (acc, i) => {
        if (i.usedAt) {
          acc.usedInvites.push(i);
        } else if (new Date(i.expiresAt) > now) {
          acc.activeInvites.push(i);
        } else {
          acc.expiredInvites.push(i);
        }
        return acc;
      },
      { activeInvites: [], usedInvites: [], expiredInvites: [] }
    );
  }, [invites]);

  const toggleRole = useCallback(async (user: User) => {
    const newRole: Role = user.role === "admin" ? "member" : "admin";
    const res = await fetch(`/api/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role: newRole }),
    });
    if (!res.ok) { alert("Failed to update role"); return; }
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
  }, []);

  const deleteUser = useCallback(async (user: User) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); alert(j.error ?? "Error"); return; }
    setUsers(prev => prev.filter(u => u.id !== user.id));
  }, []);

  const generateInvite = useCallback(async () => {
    const res = await fetch("/api/invites", { method: "POST" });
    if (!res.ok) { alert("Failed to create invite"); return; }
    const { token, id } = await res.json();
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setInviteCopied(true);
    setInvites(prev => [
      {
        id,
        token,
        usedAt:    null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const revokeInvite = useCallback(async (invite: Invite) => {
    if (!confirm("Revoke this invite link?")) return;
    const res = await fetch(`/api/invites/${invite.token}`, { method: "DELETE" });
    if (!res.ok) { alert("Failed to revoke"); return; }
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-4xl">

      <div className="flex items-center justify-between mb-5 pb-4 border-b border-secondary">
        <h1 className="text-md font-semibold tracking-tight">Admin</h1>
        <div className="flex gap-1">
          {(["users", "board"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-3 py-1 rounded-sm font-mono text-2xs tracking-wide transition-all",
                "bg-transparent border-0 cursor-pointer",
                tab === t
                  ? "bg-accent text-ink border border-outline"
                  : "text-muted hover:text-ink hover:bg-accent",
              ].join(" ")}
            >
              {t === "users" ? "Users" : "Board"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Board Settings tab ── */}
      {tab === "board" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="label">Board Options</span>
            {boardSaved && <span className="text-2xs text-success">Saved</span>}
          </div>

          <div className="flex flex-col gap-3">
            {([
              {
                key:   "showStoryPoints" as const,
                label: "Story Points",
                desc:  "Zeigt Story-Point-Badges auf Task-Karten und im Task-Detail an.",
              },
              {
                key:   "showComments" as const,
                label: "Comments / Messages",
                desc:  "Zeigt den Kommentar-Bereich im Task-Detail an.",
              },
            ] as { key: keyof BoardSettings; label: string; desc: string }[]).map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4
                           bg-surface border border-secondary rounded-sm px-4 py-3"
              >
                <div>
                  <div className="text-xs font-medium text-ink mb-0.5">{label}</div>
                  <div className="text-2xs text-muted">{desc}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={boardSettings[key]}
                  disabled={boardSaving}
                  onClick={() => saveBoardSettings({ [key]: !boardSettings[key] })}
                  className={[
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
                    "transition-colors duration-150 cursor-pointer border-0",
                    boardSettings[key] ? "bg-primary" : "bg-outline",
                    boardSaving ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform duration-150",
                      boardSettings[key] ? "translate-x-[18px]" : "translate-x-[3px]",
                    ].join(" ")}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Users tab ── */}
      {tab === "users" && <>

      {/* Users */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="label">Users ({users.length})</span>
        </div>

        <div className="border border-secondary rounded-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-secondary bg-surface">
                <th className="label text-left px-4 py-2 font-normal">Username</th>
                <th className="label text-left px-4 py-2 font-normal">Role</th>
                <th className="label text-left px-4 py-2 font-normal hidden sm:table-cell">Joined</th>
                <th className="px-4 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-secondary last:border-0 hover:bg-surface transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono">{user.username}</span>
                        {isSelf && <span className="text-2xs text-dim">(you)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${user.role === "admin" ? "badge-active" : "badge-done"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-2xs text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {!isSelf && (
                          <button
                            onClick={() => toggleRole(user)}
                            className="btn-ghost py-1 text-2xs"
                            title={`Make ${user.role === "admin" ? "member" : "admin"}`}
                          >
                            {user.role === "admin" ? "→ member" : "→ admin"}
                          </button>
                        )}
                        <button
                          onClick={() => setPwUser(user)}
                          className="btn-ghost py-1 text-2xs"
                        >
                          Reset PW
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => deleteUser(user)}
                            className="btn-danger py-1 text-2xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invites */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="label">Invite Links</span>
          <button onClick={generateInvite} className="btn-primary">
            {inviteCopied ? "Link copied!" : "+ Generate Invite"}
          </button>
        </div>

        {invites.length === 0 ? (
          <div className="border border-dashed border-outline rounded-sm p-8 text-center">
            <p className="text-xs text-muted">No invite links yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <InviteSection title="Active"  invites={activeInvites}  onRevoke={revokeInvite} />
            <InviteSection title="Used"    invites={usedInvites} />
            <InviteSection title="Expired" invites={expiredInvites} onRevoke={revokeInvite} />
          </div>
        )}
      </section>

      </>}

      {pwUser && (
        <PasswordModal user={pwUser} onClose={() => setPwUser(null)} />
      )}
    </div>
  );
}
