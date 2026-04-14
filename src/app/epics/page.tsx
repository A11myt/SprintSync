import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEpics, getTasks, getSprints } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import EpicsClient from "@/components/EpicsClient";

export default async function EpicsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [epics, tasks, sprints] = await Promise.all([
    getEpics(),
    getTasks(),
    getSprints(),
  ]);

  return (
    <AppLayout>
      <EpicsClient initialEpics={epics} tasks={tasks} sprints={sprints} />
    </AppLayout>
  );
}
