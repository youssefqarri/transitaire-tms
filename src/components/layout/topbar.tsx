"use client";

import { Search, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: UserRole;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="h-16 px-8 border-b border-[var(--color-rule)] bg-[var(--color-paper)] sticky top-0 z-30 flex items-center gap-6">
      <form
        className="flex-1 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          router.push(`/dossiers?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-0 size-3.5 text-[var(--color-ink-mute)]" strokeWidth={1.5} />
          <input
            name="q"
            placeholder="Rechercher un dossier, DUM, client, référence…"
            className="w-full h-9 pl-6 pr-4 text-[14px] font-sans bg-transparent
              border-0 border-b border-[var(--color-rule)] rounded-none
              placeholder:text-[var(--color-ink-mute)] focus:outline-none focus:border-[var(--color-ink)]
              transition-colors"
          />
        </div>
      </form>

      <div className="hidden lg:block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
        <span className="tabular">{today}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 px-2 py-1.5 hover:bg-[var(--color-paper-strong)] transition-colors"
        >
          <Avatar name={name} size={32} />
          <div className="text-left hidden lg:block leading-tight">
            <div className="text-[13px] font-medium">{name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)]">
              {ROLE_LABELS[role]}
            </div>
          </div>
          <ChevronDown className="size-3.5 text-[var(--color-ink-mute)]" strokeWidth={1.5} />
        </button>
        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-60 bg-[var(--color-card)] border border-[var(--color-rule-strong)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)] z-40 animate-fade-up"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-4 py-3 border-b border-[var(--color-rule)]">
              <div className="text-[13px] font-medium">{name}</div>
              <div className="text-[11px] text-[var(--color-ink-mute)] truncate font-mono">
                {email}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.10em] flex items-center gap-2 hover:bg-[var(--color-paper-strong)] text-left text-[var(--color-stamp)]"
            >
              <LogOut className="size-3.5" strokeWidth={1.5} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
