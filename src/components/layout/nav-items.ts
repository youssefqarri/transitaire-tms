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
  Trash2,
  ShieldCheck,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
  // visible uniquement pour les admins PLATEFORME (Evead), indépendamment du rôle cabinet
  platformOnly?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

// rôles internes ayant accès au domaine commercial (clients, fournisseurs, emails)
const NON_COMMIS: UserRole[] = ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU", "COMPTABILITE"];
// /factures : uniquement comptable + admin (Déclarant, Exploitation, Bureau exclus)
const FACTURATION_ACCESS: UserRole[] = ["ADMIN", "COMPTABILITE"];
// /notifications : tout le monde sauf Comptabilité et Commis
const NOTIF_ACCESS: UserRole[] = ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"];

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
      { href: "/factures", label: "Factures", icon: Receipt, roles: FACTURATION_ACCESS },
    ],
  },
  {
    title: "Registre",
    items: [
      { href: "/clients", label: "Clients", icon: Building2, roles: NON_COMMIS },
      { href: "/fournisseurs", label: "Fournisseurs", icon: Truck, roles: NON_COMMIS },
      { href: "/notifications", label: "Notifications", icon: Bell, roles: NOTIF_ACCESS },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
      { href: "/templates", label: "Templates", icon: MessageSquare, roles: ["ADMIN"] },
      { href: "/audit", label: "Audit", icon: ScrollText, roles: ["ADMIN"] },
      { href: "/corbeille", label: "Corbeille", icon: Trash2, roles: ["ADMIN"] },
      { href: "/parametres", label: "Paramètres", icon: Settings, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Plateforme",
    items: [{ href: "/admin", label: "Cabinets", icon: ShieldCheck, platformOnly: true }],
  },
];

export function visibleSections(role: UserRole, isPlatform = false): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({
      ...s,
      items: s.items.filter((it) =>
        it.platformOnly ? isPlatform : !it.roles || it.roles.includes(role),
      ),
    }))
    .filter((s) => s.items.length > 0);
}
