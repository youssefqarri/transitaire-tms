import { cn } from "@/lib/utils";

/**
 * Avatar avec couleur déterministe à partir du nom (12 teintes neutres).
 * Plus joli qu'un gris uniforme sans tomber dans le multicolore agressif.
 */
const HUES = [220, 240, 250, 260, 200, 180, 160, 30, 60, 90, 0, 300];

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

export function Avatar({
  name,
  className,
  size = 32,
  variant = "tinted",
}: {
  name: string | null | undefined;
  className?: string;
  size?: number;
  /** 'tinted' = teinte douce dérivée du nom (par défaut). 'neutral' = gris. */
  variant?: "tinted" | "neutral";
}) {
  const safe = name?.trim() || "?";
  const initials = safe
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const hue = variant === "tinted" ? hashHue(safe) : null;
  const bg = hue !== null ? `oklch(94% 0.05 ${hue})` : "var(--color-surface-2)";
  const fg = hue !== null ? `oklch(38% 0.10 ${hue})` : "var(--color-fg-2)";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center select-none rounded-full",
        "border border-[var(--color-border)]",
        "font-semibold tracking-tight",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: bg,
        color: fg,
      }}
      aria-label={safe}
    >
      {initials || "?"}
    </div>
  );
}
