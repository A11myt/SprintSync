import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getTasks, getSprints, getEpics, getActiveSprint } from "@/lib/data";
import AppLayout from "@/components/AppLayout";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tasks, , epics, activeSprint] = await Promise.all([
    getTasks(),
    getSprints(),
    getEpics(),
    getActiveSprint(),
  ]);

  const sprintTasks = activeSprint ? tasks.filter(t => t.sprint === activeSprint.id) : [];
  const doneTasks   = sprintTasks.filter(t => t.status === "done");
  const pct         = sprintTasks.length > 0
    ? Math.round((doneTasks.length / sprintTasks.length) * 100)
    : 0;

  const today             = new Date().toISOString().slice(0, 10);
  const dueTodayOrOverdue = tasks.filter(t => t.due && t.due <= today && t.status !== "done");
  const inProgress        = tasks.filter(t => t.status === "in-progress");
  const backlogCount      = tasks.filter(t => t.status === "backlog").length;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl">

        {/* Welcome */}
        <div className="flex items-baseline gap-3 mb-5 pb-4 border-b border-divider">
          <h1 className="text-md font-semibold tracking-tight">Dashboard</h1>
          <span className="text-2xs text-muted">{today}</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

          {/* Active Sprint (spans 2 cols) */}
          <div className="card col-span-1 sm:col-span-2 p-4">
            <span className="label block mb-3">Active Sprint</span>
            {activeSprint ? (
              <div>
                <div className="text-md font-medium mb-1">{activeSprint.title}</div>
                {activeSprint.goal && (
                  <div className="text-xs text-muted italic mb-3">"{activeSprint.goal}"</div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {doneTasks.length}/{sprintTasks.length}
                  </span>
                </div>
                <Link href="/board" className="text-2xs text-primary hover:opacity-70">
                  Open Board →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>No active sprint.</span>
                <Link href="/sprints" className="text-primary">Create Sprint →</Link>
              </div>
            )}
          </div>

          {/* Backlog count */}
          <div className="card p-4">
            <span className="label block mb-3">Backlog</span>
            <div className="text-[40px] font-bold leading-none tracking-[-2px] mb-3 text-muted">
              {backlogCount}
            </div>
            <Link href="/backlog" className="text-2xs text-primary hover:opacity-70">
              Manage →
            </Link>
          </div>

          {/* In Progress */}
          <div className="card p-4">
            <span className="label block mb-3">In Progress</span>
            <div className="text-[40px] font-bold leading-none tracking-[-2px] mb-3">
              {inProgress.length}
            </div>
            <div className="flex flex-col gap-1">
              {inProgress.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span className={`prio prio-${t.priority}`} />
                  <span className="text-2xs text-muted truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Due today / overdue */}
          <div className="card p-4">
            <span className="label block mb-3">Due / Overdue</span>
            <div className={[
              "text-[40px] font-bold leading-none tracking-[-2px] mb-3",
              dueTodayOrOverdue.length > 0 ? "text-error" : "text-muted",
            ].join(" ")}>
              {dueTodayOrOverdue.length}
            </div>
            <div className="flex flex-col gap-1">
              {dueTodayOrOverdue.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span className="text-2xs text-orange shrink-0">{t.due?.slice(5)}</span>
                  <span className="text-2xs text-muted truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Epics */}
          <div className="card p-4">
            <span className="label block mb-3">Epics</span>
            {epics.length === 0 ? (
              <span className="text-xs text-muted">
                None yet. <Link href="/epics" className="text-primary">Create →</Link>
              </span>
            ) : (
              <div className="flex flex-col gap-2.5">
                {epics.map(epic => {
                  const et = tasks.filter(t => t.epic === epic.id);
                  const ed = et.filter(t => t.status === "done").length;
                  const p  = et.length > 0 ? Math.round((ed / et.length) * 100) : 0;
                  return (
                    <div key={epic.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: epic.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-2xs mb-1 truncate">{epic.title}</div>
                        <div className="progress-track">
                          <div
                            className="h-full rounded-none transition-all duration-500"
                            style={{ width: `${p}%`, background: epic.color }}
                          />
                        </div>
                      </div>
                      <span className="text-2xs text-muted w-7 text-right shrink-0">{p}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
