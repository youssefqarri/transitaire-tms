import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "CLIENT") redirect("/portail");

  const unreadCount = await prisma.notification.count({
    where: {
      read: false,
      OR: [{ userId: session.user.id }, { role: session.user.role }],
    },
  });

  return (
    <div className="flex min-h-screen bg-[var(--color-paper)]">
      <Sidebar role={session.user.role} unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
        />
        <main className="flex-1 px-8 lg:px-12 py-10 lg:py-14">{children}</main>
      </div>
    </div>
  );
}
