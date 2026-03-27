import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics, getUsers } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import BoardClient from "@/components/BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
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
      <BoardClient initialTasks={tasks} sprints={sprints} epics={epics} users={users} />
    </AppLayout>
  );
}
