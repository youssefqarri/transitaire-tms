import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          <Card>
            <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
        <Card>
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="size-3 rounded-full mt-1" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-32" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
