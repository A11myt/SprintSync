"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Task, Epic, Sprint } from "@/lib/data";

type ResultItem = {
  type:   "task" | "epic" | "sprint" | "nav";
  id:     string;
  label:  string;
  sub?:   string;
  url:    string;
  color?: string;
};

const NAV_SHORTCUTS: ResultItem[] = [
  { type: "nav", id: "nav-board",   label: "Board",   sub: "page", url: "/board"   },
  { type: "nav", id: "nav-backlog", label: "Backlog", sub: "page", url: "/backlog" },
  { type: "nav", id: "nav-sprints", label: "Sprints", sub: "page", url: "/sprints" },
  { type: "nav", id: "nav-epics",   label: "Epics",   sub: "page", url: "/epics"   },
];

const TYPE_ICON: Record<ResultItem["type"], string> = {
  task:   "◻",
  epic:   "◎",
  sprint: "⟳",
  nav:    "◈",
};

export default function CommandPalette() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [epics, setEpics]     = useState<Epic[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  // Open / close shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Fetch data once on first open
  const fetched = useRef(false);
  useEffect(() => {
    if (!open || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.all([
      fetch("/api/tasks").then(r  => r.json()),
      fetch("/api/epics").then(r  => r.json()),
      fetch("/api/sprints").then(r => r.json()),
    ]).then(([t, e, s]) => {
      setTasks(Array.isArray(t) ? t : []);
      setEpics(Array.isArray(e) ? e : []);
      setSprints(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  // Build results
  const q       = query.toLowerCase().trim();
  const results: ResultItem[] = [];

  if (!q) {
    results.push(...NAV_SHORTCUTS);
    tasks.slice(0, 4).forEach(t => {
      results.push({ type: "task", id: t.id, label: t.title, sub: t.status, url: "/board" });
    });
  } else {
    tasks
      .filter(t => t.title.toLowerCase().includes(q) || (t.body ?? "").toLowerCase().includes(q))
      .slice(0, 6)
      .forEach(t => {
        results.push({ type: "task", id: t.id, label: t.title, sub: t.status, url: "/board" });
      });
    epics
      .filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(e => {
        results.push({ type: "epic", id: e.id, label: e.title, sub: "epic", url: "/epics", color: e.color });
      });
    sprints
      .filter(s => s.title.toLowerCase().includes(q) || s.goal.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(s => {
        results.push({ type: "sprint", id: s.id, label: s.title, sub: s.status, url: "/sprints" });
      });
    NAV_SHORTCUTS
      .filter(n => n.label.toLowerCase().includes(q))
      .forEach(n => results.push(n));
  }

  const navigate = useCallback((url: string) => {
    router.push(url);
    setOpen(false);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].url);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[min(560px,95vw)] bg-surface border border-secondary rounded-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-secondary">
          <span className="text-dim text-sm shrink-0">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, epics, sprints…"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-ink
                       placeholder:text-dim font-mono"
          />
          <kbd className="text-2xs text-dim bg-background border border-secondary
                          px-1 rounded-[2px] shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        {loading ? (
          <div className="px-3 py-5 text-xs text-muted text-center">Loading…</div>
        ) : results.length === 0 ? (
          <div className="px-3 py-5 text-xs text-muted text-center">
            No results for &quot;{query}&quot;
          </div>
        ) : (
          <ul className="py-1 max-h-80 overflow-y-auto list-none m-0 p-0">
            {!q && (
              <li className="px-3 py-1">
                <span className="text-2xs text-dim tracking-[1px] uppercase">Navigation</span>
              </li>
            )}
            {results.map((r, i) => {
              const isNav = r.type === "nav";
              const showTaskHeader = !q && i === NAV_SHORTCUTS.length;
              return (
                <>
                  {showTaskHeader && (
                    <li key="recent-header" className="px-3 py-1 border-t border-secondary mt-1">
                      <span className="text-2xs text-dim tracking-[1px] uppercase">Recent Tasks</span>
                    </li>
                  )}
                  <li key={r.id + r.type}>
                    <button
                      onClick={() => navigate(r.url)}
                      onMouseEnter={() => setSelected(i)}
                      className={[
                        "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                        "border-0 bg-transparent font-mono cursor-pointer transition-colors duration-75",
                        i === selected ? "bg-accent text-ink" : "text-muted hover:bg-accent hover:text-ink",
                      ].join(" ")}
                    >
                      {r.color ? (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: r.color }}
                        />
                      ) : (
                        <span className="text-dim text-xs w-4 text-center shrink-0">
                          {TYPE_ICON[r.type]}
                        </span>
                      )}
                      <span className="text-xs flex-1 truncate">{r.label}</span>
                      {r.sub && (
                        <span className={`text-2xs shrink-0 ${isNav ? "text-primary" : "text-dim"}`}>
                          {r.sub}
                        </span>
                      )}
                    </button>
                  </li>
                </>
              );
            })}
          </ul>
        )}

        {/* Footer hints */}
        <div className="px-3 py-1.5 border-t border-secondary flex items-center gap-4">
          <span className="text-2xs text-dim">↑↓ navigate</span>
          <span className="text-2xs text-dim">↵ open</span>
          <span className="text-2xs text-dim">esc close</span>
          <span className="ml-auto text-2xs text-dim">
            <kbd className="bg-background border border-secondary px-1 rounded-[2px]">⌘K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
