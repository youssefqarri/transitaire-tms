"use client";

import { Search, LogOut, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 px-3 sm:px-5 lg:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md sticky top-0 z-30 flex items-center gap-3 sm:gap-4">
      <MobileNav role={role} unreadCount={unreadCount} />

      <form
        className="flex-1 sm:flex-initial sm:w-full sm:max-w-md"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          router.push(`/dossiers?q=${encodeURIComponent(q)}`);
        }}
      >
        <label className="relative block">
          <span className="sr-only">Rechercher</span>
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            name="q"
            placeholder="Rechercher un dossier, DUM, client…"
            aria-label="Rechercher"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-[var(--color-surface-2)] border border-transparent rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:bg-[var(--color-surface)] focus:border-[var(--color-border-2)] focus:ring-2 focus:ring-[var(--color-accent-ring)] transition-all"
          />
        </label>
      </form>

      <div ref={menuRef} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 px-1.5 py-1 rounded-[var(--radius)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <Avatar name={name} size={28} />
          <div className="text-left hidden lg:block leading-tight">
            <div className="text-[13px] font-medium text-[var(--color-fg)]">{name}</div>
            <div className="text-[11px] text-[var(--color-fg-3)]">{ROLE_LABELS[role]}</div>
          </div>
          <ChevronDown
            className={`size-3 text-[var(--color-fg-mute)] hidden sm:block transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-pop overflow-hidden z-40 animate-scale-in origin-top-right"
          >
            <div className="px-3 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5">
              <Avatar name={name} size={36} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--color-fg)] truncate">
                  {name}
                </div>
                <div className="text-[12px] text-[var(--color-fg-3)] truncate">
                  {email}
                </div>
                <div className="text-[11px] text-[var(--color-fg-mute)] mt-0.5">
                  {ROLE_LABELS[role]}
                </div>
              </div>
            </div>
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="w-full px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[var(--color-surface-2)] text-left text-[var(--color-fg-2)] hover:text-[var(--color-fg)]"
            >
              <User className="size-3.5" strokeWidth={1.75} />
              Mon profil
            </Link>
            <button
              type="button"
              onClick={logout}
              role="menuitem"
              className="w-full px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[var(--color-surface-2)] text-left text-[var(--color-danger)] border-t border-[var(--color-border)]"
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
