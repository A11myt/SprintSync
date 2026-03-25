import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSprints, getTasks } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import SprintsClient from "@/components/SprintsClient";

export default async function SprintsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [sprints, tasks] = await Promise.all([
    getSprints(),
    getTasks(),
  ]);

  return (
    <AppLayout>
      <SprintsClient initialSprints={sprints} tasks={tasks} />
    </AppLayout>
  );
}
