import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import BoardClient from "@/components/BoardClient";

export default async function BoardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tasks, sprints, epics] = await Promise.all([
    getTasks(),
    getSprints(),
    getEpics(),
  ]);

  return (
    <AppLayout>
      <BoardClient initialTasks={tasks} sprints={sprints} epics={epics} />
    </AppLayout>
  );
}
