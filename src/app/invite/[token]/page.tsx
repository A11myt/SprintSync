import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import InviteForm from "./InviteForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[min(360px,95vw)]">

        <div className="mb-6 text-center">
          <div className="font-mono text-sm font-bold tracking-tight mb-1">
            Vault<span className="text-primary">Board</span>
          </div>
          <div className="text-2xs text-muted">You have been invited — create your account</div>
        </div>

        <div className="bg-surface border border-outline rounded-sm p-6">
          <InviteForm token={token} />
        </div>
      </div>
    </div>
  );
}
