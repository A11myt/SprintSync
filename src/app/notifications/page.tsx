import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getNotifications } from "@/lib/data";
import AppLayout from "@/components/AppLayout";
import NotificationsClient from "@/components/NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await getNotifications(session.user.name!);

  return (
    <AppLayout>
      <NotificationsClient initialNotifications={notifications} />
    </AppLayout>
  );
}
