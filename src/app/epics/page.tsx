import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEpics, getTasks } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import EpicsClient from "@/components/EpicsClient";

export default async function EpicsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [epics, tasks] = await Promise.all([
    getEpics(),
    getTasks(),
  ]);

  return (
    <AppLayout>
      <EpicsClient initialEpics={epics} tasks={tasks} />
    </AppLayout>
  );
}
