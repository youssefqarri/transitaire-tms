import { cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
  size = 32,
}: {
  name: string | null | undefined;
  className?: string;
  size?: number;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center select-none",
        "bg-[var(--color-ink)] text-[var(--color-paper)]",
        "font-mono text-[10px] font-medium uppercase tracking-wider",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32, borderRadius: 2 }}
    >
      {initials || "?"}
    </div>
  );
}
