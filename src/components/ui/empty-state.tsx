import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * État vide standardisé pour les listes/sections.
 *
 *   <EmptyState icon={Folder} title="Aucun dossier" hint="Crée le premier" cta={<Button>…</Button>} />
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  cta,
  className = "",
}: {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="mx-auto size-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
          <Icon className="size-5 text-[var(--color-fg-mute)]" strokeWidth={1.5} />
        </div>
      )}
      <div className="text-[14px] font-medium text-[var(--color-fg)]">{title}</div>
      {hint && (
        <div className="text-[13px] text-[var(--color-fg-3)] mt-1.5 max-w-md mx-auto">
          {hint}
        </div>
      )}
      {cta && <div className="mt-5 flex items-center justify-center gap-2">{cta}</div>}
    </div>
  );
}
