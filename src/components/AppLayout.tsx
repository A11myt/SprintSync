"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

async function generateInvite(): Promise<string | null> {
  const res = await fetch("/api/invites", { method: "POST" });
  if (!res.ok) return null;
  const { token } = await res.json();
  return `${window.location.origin}/invite/${token}`;
}

const nav = [
  { href: "/",        label: "Dashboard", icon: "◈" },
  { href: "/board",   label: "Board",     icon: "⊞" },
  { href: "/sprints", label: "Sprints",   icon: "⟳" },
  { href: "/epics",   label: "Epics",     icon: "◎" },
  { href: "/backlog", label: "Backlog",   icon: "≡" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [inviteLink, setInviteLink]     = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleInvite = async () => {
    const link = await generateInvite();
    if (!link) return;
    setInviteLink(link);
    await navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const openSidebar  = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen">

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-10
                         flex items-center justify-between px-4 shrink-0
                         bg-surface border-b border-secondary">
        <span className="font-mono text-sm font-bold tracking-tight">
          Vault<span className="text-primary">Board</span>
        </span>
        <button
          onClick={openSidebar}
          className="text-muted hover:text-ink bg-transparent border-0
                     cursor-pointer p-1 text-md leading-none"
        >
          ☰
        </button>
      </header>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={[
          "fixed md:sticky top-0 z-50 h-screen w-48 shrink-0",
          "bg-surface border-r border-secondary flex flex-col",
          "transition-transform duration-200 will-change-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="px-4 py-[18px] border-b border-secondary font-mono text-sm font-bold tracking-tight
                        flex items-center justify-between">
          <span>Vault<span className="text-primary">Board</span></span>
          <button
            onClick={closeSidebar}
            className="md:hidden text-muted hover:text-ink bg-transparent border-0
                       cursor-pointer p-0.5 leading-none text-xs"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col gap-0 p-2 flex-1 list-none overflow-y-auto m-0">
          {nav.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={[
                    "flex items-center gap-2 px-2 py-1.5 rounded-sm no-underline",
                    "font-mono text-2xs tracking-wide transition-all duration-100",
                    isActive
                      ? "text-ink bg-accent border-l-2 border-primary pl-[6px]"
                      : "text-muted hover:text-ink hover:bg-accent",
                  ].join(" ")}
                >
                  <span className={[
                    "text-xs w-4 text-center shrink-0",
                    isActive ? "text-primary" : "text-dim",
                  ].join(" ")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="p-2 border-t border-secondary flex flex-col gap-0.5">
          {isAdmin && (
            <button
              onClick={handleInvite}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm
                         font-mono text-2xs text-muted hover:text-ink hover:bg-accent
                         transition-all duration-100 cursor-pointer bg-transparent border-0"
            >
              <span className="text-xs w-4 text-center text-dim">✉</span>
              {inviteCopied ? "Link copied!" : "Invite user"}
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm
                       font-mono text-2xs text-muted hover:text-ink hover:bg-accent
                       transition-all duration-100 cursor-pointer bg-transparent border-0"
          >
            <span className="text-xs w-4 text-center text-dim">⏻</span>
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col pt-10 md:pt-0">
        {children}
      </main>
    </div>
  );
}
