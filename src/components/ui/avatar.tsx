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
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[oklch(70%_0.15_258)] to-[oklch(55%_0.20_280)] text-white font-medium text-xs select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </div>
  );
}
