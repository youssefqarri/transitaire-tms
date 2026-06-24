"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Numéro de la page courante (1-based). */
  page: number;
  /** Taille de page actuelle. */
  pageSize: number;
  /** Nombre total d'éléments. */
  total: number;
  /** URL de base pour construire les liens. Les `searchParams` existants sont préservés. */
  basePath: string;
  /** Si fournis, ajoutés aux URLs (déjà encodés). */
  extraParams?: Record<string, string | undefined>;
  /** Options de taille de page proposées. Default: [25, 50, 100]. */
  pageSizeOptions?: number[];
  className?: string;
};

const DEFAULT_SIZES = [25, 50, 100];

function buildUrl(
  base: string,
  page: number,
  size: number,
  extra: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  if (page > 1) sp.set("page", String(page));
  if (!DEFAULT_SIZES.includes(size) || size !== DEFAULT_SIZES[0]) {
    sp.set("size", String(size));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  extraParams = {},
  pageSizeOptions = DEFAULT_SIZES,
  className,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const prevUrl = page > 1 ? buildUrl(basePath, page - 1, pageSize, extraParams) : null;
  const nextUrl = page < totalPages ? buildUrl(basePath, page + 1, pageSize, extraParams) : null;

  // Pages à afficher : 1, … , p-1, p, p+1, … , last
  const pages: (number | "…")[] = [];
  const win = 1;
  const add = (n: number) => {
    if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n);
  };
  add(1);
  if (page - win > 2) pages.push("…");
  for (let i = page - win; i <= page + win; i++) add(i);
  if (page + win < totalPages - 1) pages.push("…");
  add(totalPages);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 flex-wrap px-4 py-3 border-t border-[var(--color-border)]",
        className,
      )}
    >
      <div className="text-[12px] text-[var(--color-fg-3)] tnum">
        <span className="text-[var(--color-fg)] font-medium">{from}</span>–
        <span className="text-[var(--color-fg)] font-medium">{to}</span>
        {" "}sur{" "}
        <span className="text-[var(--color-fg)] font-medium">{total}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sélecteur taille de page */}
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-3)] mr-2">
          <span>Par page</span>
          <div className="flex items-center gap-0.5 rounded-[var(--radius)] bg-[var(--color-surface-2)] p-0.5">
            {pageSizeOptions.map((s) => {
              const url = buildUrl(basePath, 1, s, extraParams);
              const active = s === pageSize;
              return (
                <Link
                  key={s}
                  href={url}
                  className={cn(
                    "px-2 h-6 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[12px] tnum transition-colors",
                    active
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] font-medium shadow-card"
                      : "text-[var(--color-fg-3)] hover:text-[var(--color-fg)]",
                  )}
                >
                  {s}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pages */}
        <nav className="flex items-center gap-0.5" aria-label="Pagination">
          {prevUrl ? (
            <Link
              href={prevUrl}
              className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
              aria-label="Page précédente"
              title="Page précédente"
            >
              <ChevronLeft className="size-3.5" strokeWidth={2} />
            </Link>
          ) : (
            <span
              aria-disabled
              className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-mute)] cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5" strokeWidth={2} />
            </span>
          )}

          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`e-${i}`}
                className="size-8 inline-flex items-center justify-center text-[12px] text-[var(--color-fg-mute)]"
              >
                …
              </span>
            ) : p === page ? (
              <span
                key={p}
                aria-current="page"
                className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[12px] tnum font-medium bg-[var(--color-fg)] text-[var(--color-surface)]"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={buildUrl(basePath, p, pageSize, extraParams)}
                className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[12px] tnum text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
              >
                {p}
              </Link>
            ),
          )}

          {nextUrl ? (
            <Link
              href={nextUrl}
              className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
              aria-label="Page suivante"
              title="Page suivante"
            >
              <ChevronRight className="size-3.5" strokeWidth={2} />
            </Link>
          ) : (
            <span
              aria-disabled
              className="size-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-fg-mute)] cursor-not-allowed"
            >
              <ChevronRight className="size-3.5" strokeWidth={2} />
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}

