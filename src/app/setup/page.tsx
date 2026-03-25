import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  // If users already exist, redirect to login
  try {
    const count = await db.user.count();
    if (count > 0) redirect("/login");
  } catch {
    // DB unavailable — allow through
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[min(360px,95vw)]">

        <div className="mb-6 text-center">
          <div className="font-mono text-sm font-bold tracking-tight mb-1">
            Vault<span className="text-primary">Board</span>
          </div>
          <div className="text-2xs text-muted">Create first user</div>
        </div>

        <div className="bg-surface border border-outline rounded-sm p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
