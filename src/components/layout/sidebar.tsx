"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/enums";
import { visibleSections } from "./nav-items";

export function Sidebar({ role, unreadCount = 0 }: { role: UserRole; unreadCount?: number }) {
  const pathname = usePathname();
  const sections = visibleSections(role);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-[232px] shrink-0 h-screen sticky top-0",
        "bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)]",
      )}
    >
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-[var(--color-sidebar-border)]">
        <div className="size-7 rounded-[var(--radius-sm)] bg-[var(--color-fg)] flex items-center justify-center text-[var(--color-surface)] text-[12px] font-bold">
          T
        </div>
        <span className="text-[14px] font-semibold tracking-tight">Transitaire</span>
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
                      "flex items-center gap-2.5 px-2.5 h-8 rounded-[var(--radius-sm)] text-[13px] transition-colors",
                      active
                        ? "bg-[var(--color-sidebar-active)] text-[var(--color-fg)] font-medium"
                        : "text-[var(--color-fg-2)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-[var(--color-fg)]" : "text-[var(--color-fg-mute)]",
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
  );
}
