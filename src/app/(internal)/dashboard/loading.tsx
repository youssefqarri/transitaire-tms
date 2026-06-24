import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      {/* 4 cartouches compactes : pastille d'icône + valeur + libellé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="p-3.5 flex items-center gap-3">
              <Skeleton className="size-8 rounded-[var(--radius)] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Mouvements récents : lignes empilées (n° + statut, client + valeur, dates) */}
        <Card>
          <div className="px-5 py-3.5 border-b border-[var(--color-border)]">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </Card>
        {/* Répartition par statut : barres de progression */}
        <Card>
          <div className="px-5 py-3.5 border-b border-[var(--color-border)]">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="px-5 py-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-6" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
