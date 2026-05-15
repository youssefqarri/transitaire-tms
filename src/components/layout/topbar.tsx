"use client";

import { Search, LogOut, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { MobileNav } from "./mobile-nav";

export function Topbar({
  name,
  email,
  role,
  unreadCount = 0,
}: {
  name: string;
  email: string;
  role: UserRole;
  unreadCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 px-3 sm:px-5 lg:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-30 flex items-center gap-3 sm:gap-4">
      <MobileNav role={role} unreadCount={unreadCount} />

      <form
        className="flex-1 sm:flex-initial sm:w-full sm:max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          router.push(`/dossiers?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
            strokeWidth={1.75}
          />
          <input
            name="q"
            placeholder="Rechercher…"
            className="w-full h-8 pl-8 pr-3 text-[13px] bg-[var(--color-surface-2)] border border-transparent rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:bg-[var(--color-surface)] focus:border-[var(--color-border-2)] focus:ring-2 focus:ring-[var(--color-accent-ring)] transition-all"
          />
        </div>
      </form>

      <div className="relative ml-auto">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-1.5 py-1 rounded-[var(--radius)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <Avatar name={name} size={28} />
          <div className="text-left hidden lg:block leading-tight">
            <div className="text-[12.5px] font-medium">{name}</div>
            <div className="text-[10.5px] text-[var(--color-fg-3)]">{ROLE_LABELS[role]}</div>
          </div>
          <ChevronDown className="size-3 text-[var(--color-fg-mute)] hidden sm:block" strokeWidth={2} />
        </button>
        {open && (
          <div
            className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] overflow-hidden z-40 animate-fade-in"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
              <div className="text-[13px] font-medium">{name}</div>
              <div className="text-[11.5px] text-[var(--color-fg-3)] truncate">{email}</div>
            </div>
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="w-full px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[var(--color-surface-2)] text-left text-[var(--color-fg-2)]"
            >
              <User className="size-3.5" strokeWidth={1.75} />
              Mon profil
            </Link>
            <button
              onClick={logout}
              className="w-full px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[var(--color-surface-2)] text-left text-[var(--color-fg-2)] border-t border-[var(--color-border)]"
            >
              <LogOut className="size-3.5" strokeWidth={1.75} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
