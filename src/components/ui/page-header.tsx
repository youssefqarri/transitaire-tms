import type { ReactNode } from "react";

/**
 * En-tête de page standardisé.
 *
 *  <PageHeader
 *    title="Dossiers"
 *    subtitle="123 dossiers actifs"
 *    actions={<Button>Nouveau</Button>}
 *  />
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex items-start justify-between gap-4 flex-wrap ${className}`}
    >
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-fg)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[var(--color-fg-3)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}
