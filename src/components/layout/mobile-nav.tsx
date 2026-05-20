"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/enums";
import { visibleSections } from "./nav-items";

export function MobileNav({
  role,
  unreadCount = 0,
}: {
  role: UserRole;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sections = visibleSections(role);

  // Ferme le drawer à chaque navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Ouvrir le menu (${unreadCount} non lu)` : "Ouvrir le menu"}
        className="md:hidden relative size-9 -ml-1 rounded-[var(--radius)] flex items-center justify-center text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <Menu className="size-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--color-accent)] ring-2 ring-[var(--color-surface)]" />
        )}
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[var(--color-sidebar)] z-50 md:hidden flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--color-sidebar-border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="size-8 rounded-[var(--radius)] flex items-center justify-center text-white text-[13px] font-bold tracking-tight"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), oklch(38% 0.18 270))",
                  }}
                >
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold tracking-tight leading-tight">
                    Transitaire
                  </div>
                  <div className="text-[10.5px] text-[var(--color-fg-mute)] leading-tight">
                    TMS · Douane Maroc
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="size-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-2)] hover:bg-[var(--color-sidebar-hover)]"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 px-2.5 py-4 overflow-y-auto scrollbar-thin space-y-5">
              {sections.map((section, idx) => (
                <div key={section.title ?? idx}>
                  {section.title && (
                    <div className="px-2.5 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-fg-mute)]">
                      {section.title}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((it) => {
                      const active =
                        pathname === it.href ||
                        (it.href !== "/dashboard" && pathname.startsWith(it.href + "/"));
                      const Icon = it.icon;
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 h-10 rounded-[var(--radius-sm)] text-[14px] transition-colors",
                            active
                              ? "bg-[var(--color-sidebar-active)] text-[var(--color-fg)] font-medium"
                              : "text-[var(--color-fg-2)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-fg)]",
                          )}
                        >
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[var(--color-accent)]"
                            />
                          )}
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]",
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="flex-1 truncate">{it.label}</span>
                          {it.href === "/notifications" && unreadCount > 0 && (
                            <span className="bg-[var(--color-accent)] text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center tnum">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-[var(--color-sidebar-border)] text-[11px] text-[var(--color-fg-mute)]">
              v1.0
            </div>
          </aside>
        </>
      )}
    </>
  );
}
