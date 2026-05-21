"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/enums";
import { visibleSections } from "./nav-items";
import { UnreadBadge } from "./unread-badge";

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
      {/* Logo / branding */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-[var(--color-sidebar-border)]">
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
                      "group relative flex items-center gap-2.5 px-2.5 h-8 rounded-[var(--radius-sm)] text-[13px]",
                      "transition-all duration-150",
                      active
                        ? "bg-[var(--color-sidebar-active)] text-[var(--color-fg)] font-medium"
                        : "text-[var(--color-fg-2)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--color-accent)]"
                      />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-fg-mute)] group-hover:text-[var(--color-fg-2)]",
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.href === "/notifications" && (
                      <UnreadBadge initial={unreadCount} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--color-sidebar-border)] flex items-center justify-between text-[10.5px] text-[var(--color-fg-mute)]">
        <span>v1.0</span>
        <span className="size-1.5 rounded-full bg-[var(--color-success)]" title="En ligne" />
      </div>
    </aside>
  );
}
