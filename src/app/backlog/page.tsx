import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics, getUsers } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import BacklogClient from "@/components/BacklogClient";

export default async function BacklogPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tasks, sprints, epics, users] = await Promise.all([
    getTasks(),
    getSprints(),
    getEpics(),
    getUsers(),
  ]);

  return (
    <AppLayout>
      <BacklogClient initialTasks={tasks} sprints={sprints} epics={epics} users={users} />
    </AppLayout>
  );
}
