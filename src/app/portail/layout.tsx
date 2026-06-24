import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "./logout-button";
import { LogoFull } from "@/components/brand/logo";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/portail"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <LogoFull className="h-7 w-auto" />
            <span className="hidden sm:inline text-[12px] text-[var(--color-fg-mute)] border-l border-[var(--color-border)] pl-2.5">
              Espace client
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px]">
            <Link
              href="/portail"
              className="text-[var(--color-fg-2)] hover:text-[var(--color-fg)] transition-colors"
            >
              Mes dossiers
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border)]">
              <Avatar name={session.user.name} size={28} />
              <span className="hidden sm:inline text-[13px] text-[var(--color-fg-2)]">
                {session.user.name}
              </span>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
