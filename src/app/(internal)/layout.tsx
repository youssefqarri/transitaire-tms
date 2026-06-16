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
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* contents = aucun impact à l'écran ; print:hidden = masqué à l'impression/PDF */}
      <div className="contents print:hidden">
        <Sidebar role={session.user.role} unreadCount={unreadCount} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="contents print:hidden">
          <Topbar
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
            unreadCount={unreadCount}
          />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
