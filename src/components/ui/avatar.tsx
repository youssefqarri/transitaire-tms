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
        "inline-flex items-center justify-center select-none rounded-full",
        "bg-[var(--color-surface-2)] text-[var(--color-fg-2)] border border-[var(--color-border)]",
        "font-medium",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "?"}
    </div>
  );
}
