import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSprints, getTasks, getUsers, getEpics, getBoardSettings } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import SprintsClient from "@/components/SprintsClient";

export default async function SprintsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [sprints, tasks, users, epics, boardSettings] = await Promise.all([
    getSprints(),
    getTasks(),
    getUsers(),
    getEpics(),
    getBoardSettings(),
  ]);

  return (
    <AppLayout>
      <SprintsClient initialSprints={sprints} tasks={tasks} epics={epics} users={users} boardSettings={boardSettings} />
    </AppLayout>
  );
}
