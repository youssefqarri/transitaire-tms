import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-6 w-40 bg-[var(--color-surface-2)] rounded" />
          <div className="h-3 w-64 bg-[var(--color-surface-2)] rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-[var(--color-surface-2)] rounded" />
      </div>
      <Card>
        <div className="divide-y divide-[var(--color-border)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 w-32 bg-[var(--color-surface-2)] rounded" />
                <div className="h-3 w-48 bg-[var(--color-surface-2)] rounded mt-2" />
              </div>
              <div className="h-4 w-20 bg-[var(--color-surface-2)] rounded" />
              <div className="h-5 w-16 bg-[var(--color-surface-2)] rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
