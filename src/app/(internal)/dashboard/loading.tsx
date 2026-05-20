import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-40 bg-[var(--color-surface-2)] rounded" />
        <div className="h-3 w-72 bg-[var(--color-surface-2)] rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="p-4 space-y-2">
              <div className="h-3 w-24 bg-[var(--color-surface-2)] rounded" />
              <div className="h-7 w-16 bg-[var(--color-surface-2)] rounded" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <Card>
          <div className="p-5 space-y-3">
            <div className="h-5 w-40 bg-[var(--color-surface-2)] rounded" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-[var(--color-surface-2)] rounded" />
            ))}
          </div>
        </Card>
        <Card>
          <div className="p-5 space-y-3">
            <div className="h-5 w-40 bg-[var(--color-surface-2)] rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 w-full bg-[var(--color-surface-2)] rounded" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
