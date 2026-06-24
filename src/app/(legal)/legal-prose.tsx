import * as React from "react";

export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">{title}</h1>
      <p className="mt-2 text-[13px] text-[var(--color-fg-mute)]">Dernière mise à jour : {updated}</p>
    </header>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)] mt-8 mb-2.5">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[14px] font-semibold text-[var(--color-fg)] mt-4 mb-1.5">{children}</h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed text-[var(--color-fg-2)] mb-3">{children}</p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[14px] leading-relaxed text-[var(--color-fg-2)] mb-3 marker:text-[var(--color-fg-mute)]">
      {children}
    </ul>
  );
}

/** Encadré pour les informations à compléter par l'exploitant (mentions légales). */
export function Fill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-[var(--color-warning-soft)] px-1 py-0.5 text-[var(--color-warning)] font-medium">
      {children}
    </span>
  );
}
