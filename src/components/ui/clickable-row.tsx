"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ligne de tableau cliquable : un clic n'importe où sur la ligne ouvre `href`
 * (même onglet). Les <CellLink> à l'intérieur stoppent la propagation pour
 * garder leur propre comportement (typiquement : ouverture en nouvel onglet).
 * - Cmd/Ctrl+clic ouvre le détail dans un nouvel onglet.
 * - Une sélection de texte ne déclenche pas la navigation.
 */
export function RowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      className={cn("cursor-pointer", className)}
      onClick={(e) => {
        if (window.getSelection()?.toString()) return; // sélection de texte → pas de nav
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank", "noopener,noreferrer");
        else router.push(href);
      }}
    >
      {children}
    </tr>
  );
}

/**
 * Lien dans une cellule d'une <RowLink> : stoppe la propagation pour ne pas
 * déclencher la navigation de la ligne. `newTab` ouvre l'entité liée (client,
 * dossier, DUM…) dans un nouvel onglet — pour ne pas perdre sa liste.
 */
export function CellLink({
  href,
  children,
  className,
  newTab,
  title,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  newTab?: boolean;
  title?: string;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={ariaLabel}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onClick={(e) => e.stopPropagation()}
      className={cn("hover:underline", className)}
    >
      {children}
    </Link>
  );
}
