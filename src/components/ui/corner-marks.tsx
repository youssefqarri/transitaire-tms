import { cn } from "@/lib/utils";

// marques de registre (printer marks) — détail signature
export function CornerMarks({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 [&_span]:absolute [&_span]:size-3 [&_span]:border-[var(--color-rule-strong)]",
        className,
      )}
    >
      <span className="left-0 top-0 border-l border-t" />
      <span className="right-0 top-0 border-r border-t" />
      <span className="left-0 bottom-0 border-l border-b" />
      <span className="right-0 bottom-0 border-r border-b" />
    </div>
  );
}
