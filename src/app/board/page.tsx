import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics, getUsers, getBoardSettings } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import BoardClient from "@/components/BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const storedSprint = cookieStore.get("board_selectedSprint")?.value ?? "";

  const [tasks, sprints, epics, users, boardSettings] = await Promise.all([
    getTasks(),
    getSprints(),
    getEpics(),
    getUsers(),
    getBoardSettings(),
  ]);

  return (
    <AppLayout>
      <BoardClient
        initialTasks={tasks}
        sprints={sprints}
        epics={epics}
        users={users}
        initialSprint={storedSprint}
        boardSettings={boardSettings}
      />
    </AppLayout>
  );
}
