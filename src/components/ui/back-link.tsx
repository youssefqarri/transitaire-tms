import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 *  <BackLink href="/dossiers">Retour aux dossiers</BackLink>
 */
export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)] transition-colors ${className}`}
    >
      <ArrowLeft className="size-3.5" strokeWidth={1.75} />
      {children}
    </Link>
  );
}
