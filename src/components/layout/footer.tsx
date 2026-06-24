import Link from "next/link";

/** Pied de page : copyright + liens légaux. Masqué à l'impression. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="print:hidden border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-4 text-[12px] text-[var(--color-fg-mute)]">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span className="tnum">{year} © Escale.ma</span>
        <span aria-hidden>—</span>
        <Link
          href="/confidentialite"
          className="hover:text-[var(--color-fg-2)] hover:underline underline-offset-2 transition-colors"
        >
          Confidentialité &amp; protection des données
        </Link>
        <span aria-hidden>—</span>
        <Link
          href="/conditions"
          className="hover:text-[var(--color-fg-2)] hover:underline underline-offset-2 transition-colors"
        >
          Conditions d&apos;utilisation
        </Link>
      </div>
    </footer>
  );
}
