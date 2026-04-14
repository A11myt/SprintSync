import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSprints, getTasks, getUsers, getEpics } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import SprintsClient from "@/components/SprintsClient";

export default async function SprintsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [sprints, tasks, users, epics] = await Promise.all([
    getSprints(),
    getTasks(),
    getUsers(),
    getEpics(),
  ]);

  return (
    <AppLayout>
      <SprintsClient initialSprints={sprints} tasks={tasks} epics={epics} users={users} />
    </AppLayout>
  );
}
