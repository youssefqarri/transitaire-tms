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
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-rule-strong)] bg-[var(--color-paper)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/portail">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
              Maison de Transit
            </div>
            <div
              className="font-display text-[24px] leading-none tracking-[-0.022em]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
            >
              Espace client
            </div>
          </Link>
          <nav className="flex items-center gap-6 font-mono text-[10.5px] uppercase tracking-[0.12em]">
            <Link href="/portail" className="hover:text-[var(--color-ink)] text-[var(--color-ink-soft)]">
              Mes dossiers
            </Link>
            <div className="flex items-center gap-3">
              <Avatar name={session.user.name} size={32} />
              <span className="hidden sm:inline normal-case tracking-normal font-sans text-[13px]">
                {session.user.name}
              </span>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-14">{children}</main>
      <footer className="max-w-6xl mx-auto px-8 py-10 border-t border-[var(--color-rule)] mt-10 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] flex justify-between">
        <span>Maison de Transit · Casablanca</span>
        <span className="tabular">{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
