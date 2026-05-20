import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "./logout-button";

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
            <div
              className="size-8 rounded-[var(--radius)] flex items-center justify-center text-white text-[13px] font-bold tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), oklch(38% 0.18 270))",
              }}
            >
              T
            </div>
            <div>
              <div className="text-[14px] font-semibold tracking-tight leading-tight text-[var(--color-fg)]">
                Espace client
              </div>
              <div className="text-[10.5px] text-[var(--color-fg-mute)] leading-tight">
                Transitaire TMS
              </div>
            </div>
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
              <span className="hidden sm:inline text-[12.5px] text-[var(--color-fg-2)]">
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
