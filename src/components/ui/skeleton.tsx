import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[var(--radius-sm)] shimmer", className)}
      {...props}
    />
  );
}

/** Squelette de ligne de table standard (mobile + desktop). */
export function RowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] last:border-0">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            i === 0 ? "w-32" : i === columns - 1 ? "w-16 ml-auto" : "flex-1",
          )}
        />
      ))}
    </div>
  );
}

/** Squelette de carte (header + 3 lignes). */
export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}
