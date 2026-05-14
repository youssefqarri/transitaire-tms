"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Mail,
  Bell,
  Users,
  Building2,
  Truck,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
  badge?: number;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dossiers", label: "Dossiers", icon: Folder },
  { href: "/dums", label: "DUMs", icon: FileText },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/fournisseurs", label: "Fournisseurs", icon: Truck },
  { href: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
  { href: "/audit", label: "Journal d'audit", icon: ScrollText, roles: ["ADMIN"] },
  { href: "/parametres", label: "Paramètres", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({ role, unreadCount = 0 }: { role: UserRole; unreadCount?: number }) {
  const pathname = usePathname();

  const items = NAV.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] h-screen sticky top-0">
      <div className="h-16 px-6 flex items-center gap-2.5 border-b border-white/5">
        <div className="size-8 rounded-xl bg-gradient-to-br from-[oklch(70%_0.18_258)] to-[oklch(55%_0.22_280)] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-black/20">
          T
        </div>
        <div className="font-semibold tracking-tight">Transitaire</div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-0.5">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/dashboard" && pathname.startsWith(it.href + "/"));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                active
                  ? "bg-white/10 text-white font-medium shadow-inner"
                  : "text-[var(--color-sidebar-muted)] hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span className="flex-1">{it.label}</span>
              {it.href === "/notifications" && unreadCount > 0 && (
                <span className="bg-[var(--color-primary)] text-white text-[10px] font-semibold rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/5 text-xs text-[var(--color-sidebar-muted)]">
        v1.0 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
