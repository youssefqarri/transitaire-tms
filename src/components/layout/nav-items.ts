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

// rôles internes ayant accès au domaine commercial (clients, factures, emails, notifications)
const NON_COMMIS: UserRole[] = ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU", "COMPTABILITE"];

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
      { href: "/emails", label: "Emails", icon: Mail, roles: NON_COMMIS },
    ],
  },
  {
    title: "Facturation",
    items: [
      { href: "/factures", label: "Factures", icon: Receipt, roles: NON_COMMIS },
    ],
  },
  {
    title: "Registre",
    items: [
      { href: "/clients", label: "Clients", icon: Building2, roles: NON_COMMIS },
      { href: "/fournisseurs", label: "Fournisseurs", icon: Truck, roles: NON_COMMIS },
      { href: "/notifications", label: "Notifications", icon: Bell, roles: NON_COMMIS },
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
