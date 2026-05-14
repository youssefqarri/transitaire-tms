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

  return (
    <header className="h-16 px-6 border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-30 flex items-center gap-4">
      <form
        action="/dossiers"
        className="flex-1 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          router.push(`/dossiers?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted-foreground)]" />
          <input
            name="q"
            placeholder="Rechercher un dossier, DUM, client, référence…"
            className="w-full h-10 pl-10 pr-4 rounded-[var(--radius)] bg-[var(--color-muted)] border border-transparent focus:bg-[var(--color-card)] focus:border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-ring)] focus:outline-none text-sm transition-all"
          />
        </div>
      </form>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
        >
          <Avatar name={name} size={32} />
          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium leading-tight">{name}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {ROLE_LABELS[role]}
            </div>
          </div>
          <ChevronDown className="size-4 text-[var(--color-muted-foreground)]" />
        </button>
        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-56 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-lg overflow-hidden animate-fade-in"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-[var(--color-muted-foreground)] truncate">
                {email}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[var(--color-muted)] text-left text-[var(--color-destructive)]"
            >
              <LogOut className="size-4" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
