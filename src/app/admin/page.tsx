import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBoardSettings } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const [users, invites, boardSettings] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, role: true, createdAt: true },
    }),
    db.invite.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, token: true, usedAt: true, createdAt: true, expiresAt: true },
    }),
    getBoardSettings(),
  ]);

  return (
    <AppLayout>
      <AdminClient
        initialUsers={users.map(u => ({ ...u, role: u.role as "admin" | "member", createdAt: u.createdAt.toISOString() }))}
        initialInvites={invites.map(i => ({
          id:        i.id,
          token:     i.token,
          usedAt:    i.usedAt?.toISOString() ?? null,
          createdAt: i.createdAt.toISOString(),
          expiresAt: i.expiresAt.toISOString(),
        }))}
        currentUserId={session.user.id!}
        initialBoardSettings={boardSettings}
      />
    </AppLayout>
  );
}
