import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
