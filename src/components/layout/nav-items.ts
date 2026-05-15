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
  Receipt,
  MessageSquare,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ],
  },
  {
    title: "Exploitation",
    items: [
      { href: "/dossiers", label: "Dossiers", icon: Folder },
      { href: "/dums", label: "DUMs", icon: FileText },
      { href: "/emails", label: "Emails", icon: Mail },
    ],
  },
  {
    title: "Facturation",
    items: [
      { href: "/factures", label: "Factures", icon: Receipt },
    ],
  },
  {
    title: "Registre",
    items: [
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/fournisseurs", label: "Fournisseurs", icon: Truck },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
      { href: "/templates", label: "Templates", icon: MessageSquare, roles: ["ADMIN"] },
      { href: "/audit", label: "Audit", icon: ScrollText, roles: ["ADMIN"] },
      { href: "/parametres", label: "Paramètres", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export function visibleSections(role: UserRole): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => !it.roles || it.roles.includes(role)),
    }))
    .filter((s) => s.items.length > 0);
}
