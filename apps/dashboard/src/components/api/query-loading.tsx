import { Skeleton } from "@usepreface/ui/components/skeleton";
import { cn } from "@usepreface/ui/lib/utils";

export function QueryLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading content"
      aria-busy="true"
      className={cn("flex flex-col gap-4 p-6", className)}
    >
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
        <Skeleton className="h-4 w-2/3 max-w-96 motion-reduce:animate-none" />
        <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" />
      </div>
    </div>
  );
}
