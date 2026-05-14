import { redirect } from "next/navigation";
import Link from "next/link";
import { Folder, FileText, LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "./logout-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/portail" className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-[oklch(70%_0.18_258)] to-[oklch(55%_0.22_280)] flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <div className="font-semibold tracking-tight">Espace client</div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/portail" className="hover:text-[var(--color-primary)]">
              Mes dossiers
            </Link>
            <div className="flex items-center gap-2">
              <Avatar name={session.user.name} size={28} />
              <span className="hidden sm:block text-sm">{session.user.name}</span>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
