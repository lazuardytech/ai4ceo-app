import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-dvh">
      {/*<aside className="hidden md:flex w-64 flex-col border-r p-3 gap-3">
        <Skeleton className="h-9 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </aside>*/}
      <main className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-2/3" />
            </div>
          ))}
        </div>
        <footer className="p-4 border-t">
          <div className="mx-auto w-full md:max-w-3xl">
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        </footer>
      </main>
    </div>
  );
}
