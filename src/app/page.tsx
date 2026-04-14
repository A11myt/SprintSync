import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics, getActiveSprint, getUsers } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tasks, sprints, epics, activeSprint, users] = await Promise.all([
    getTasks(),
    getSprints(),
    getEpics(),
    getActiveSprint(),
    getUsers(),
  ]);

  return (
    <AppLayout>
      <DashboardClient
        initialTasks={tasks}
        epics={epics}
        sprints={sprints}
        activeSprint={activeSprint}
        users={users}
      />
    </AppLayout>
  );
}
