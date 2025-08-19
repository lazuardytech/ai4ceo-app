import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

