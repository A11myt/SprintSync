"use client";

import { useState } from "react";
import type { Notification } from "@/lib/data";

interface Props {
  initialNotifications: Notification[];
}

export default function NotificationsClient({ initialNotifications }: Props) {
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [marking, setMarking] = useState(false);

  const unread = items.filter(n => !n.read).length;

  const markAllRead = async () => {
    setMarking(true);
    await fetch("/api/notifications", { method: "POST" }).catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setMarking(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3
                      border-b border-secondary bg-surface shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-md font-semibold tracking-tight">Notifications</h1>
          {unread > 0 && (
            <span className="text-2xs text-muted">{unread} unread</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="btn-ghost py-1 text-2xs"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-dim">
            <span className="text-2xl">◫</span>
            <p className="text-2xs">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary">
            {items.map(n => (
              <div
                key={n.id}
                className={[
                  "flex flex-col gap-1 px-5 py-3.5 transition-colors",
                  n.read ? "opacity-50" : "bg-overlay/30",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <span className="text-xs font-medium text-ink">{n.taskTitle}</span>
                  <span className="text-2xs text-dim ml-auto">
                    {new Date(n.created).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-2xs text-muted leading-relaxed pl-3.5">
                  <span className="font-medium text-ink">@{n.commentAuthor}</span>{" "}
                  {n.commentBody}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
