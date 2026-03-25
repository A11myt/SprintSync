import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSprints, getTasks, getUsers } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import SprintsClient from "@/components/SprintsClient";

export default async function SprintsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [sprints, tasks, users] = await Promise.all([
    getSprints(),
    getTasks(),
    getUsers(),
  ]);

  return (
    <AppLayout>
      <SprintsClient initialSprints={sprints} tasks={tasks} users={users} />
    </AppLayout>
  );
}
