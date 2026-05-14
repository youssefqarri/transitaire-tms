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
  num: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

const SECTION_DOSSIERS: NavItem[] = [
  { href: "/dashboard",    label: "Tableau",       num: "01", icon: LayoutDashboard },
  { href: "/dossiers",     label: "Dossiers",      num: "02", icon: Folder },
  { href: "/dums",         label: "DUMs",          num: "03", icon: FileText },
];

const SECTION_FLUX: NavItem[] = [
  { href: "/emails",        label: "Correspondance", num: "04", icon: Mail },
  { href: "/notifications", label: "Notifications",  num: "05", icon: Bell },
];

const SECTION_REGISTRE: NavItem[] = [
  { href: "/clients",      label: "Clients",       num: "06", icon: Building2 },
  { href: "/fournisseurs", label: "Fournisseurs",  num: "07", icon: Truck },
];

const SECTION_ADMIN: NavItem[] = [
  { href: "/utilisateurs", label: "Utilisateurs",  num: "08", icon: Users,      roles: ["ADMIN"] },
  { href: "/audit",        label: "Audit",         num: "09", icon: ScrollText, roles: ["ADMIN"] },
  { href: "/parametres",   label: "Paramètres",    num: "10", icon: Settings,   roles: ["ADMIN"] },
];

export function Sidebar({ role, unreadCount = 0 }: { role: UserRole; unreadCount?: number }) {
  const pathname = usePathname();

  const filter = (items: NavItem[]) =>
    items.filter((it) => !it.roles || it.roles.includes(role));

  const sections = [
    { title: "Exploitation", items: filter(SECTION_DOSSIERS) },
    { title: "Flux",         items: filter(SECTION_FLUX) },
    { title: "Registre",     items: filter(SECTION_REGISTRE) },
    { title: "Administration", items: filter(SECTION_ADMIN) },
  ].filter((s) => s.items.length > 0);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-[248px] shrink-0 h-screen sticky top-0",
        "bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)]",
        "border-r border-[oklch(25%_0.02_50)]",
      )}
    >
      {/* logotype éditorial */}
      <div className="px-6 pt-8 pb-7 border-b border-[oklch(22%_0.02_50)]">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-sidebar-muted)]">
          Maison de Transit
        </div>
        <Link href="/dashboard" className="block mt-1">
          <div
            className="font-display text-[26px] leading-none text-[var(--color-paper)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 400' }}
          >
            Registre
          </div>
          <div
            className="font-display italic text-[15px] leading-tight text-[oklch(75%_0.04_60)] -mt-0.5"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50, "wght" 300' }}
          >
            des dossiers
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="px-3 mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-sidebar-muted)]">
              — {section.title}
            </div>
            <div>
              {section.items.map((it) => {
                const active =
                  pathname === it.href ||
                  (it.href !== "/dashboard" && pathname.startsWith(it.href + "/"));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "group relative flex items-baseline gap-3 px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "text-[var(--color-paper)]"
                        : "text-[oklch(78%_0.012_70)] hover:text-[var(--color-paper)]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-[var(--color-stamp)]" />
                    )}
                    <span className="font-mono text-[10px] text-[var(--color-sidebar-muted)] tabular">
                      {it.num}
                    </span>
                    <span className={cn("flex-1", active && "font-medium")}>{it.label}</span>
                    {it.href === "/notifications" && unreadCount > 0 && (
                      <span className="font-mono text-[9.5px] text-[var(--color-stamp)] tabular">
                        ·{unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-[oklch(22%_0.02_50)] font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-sidebar-muted)] flex items-center justify-between">
        <span>vol. I · n° 1</span>
        <span className="tabular">{new Date().getFullYear()}</span>
      </div>
    </aside>
  );
}
