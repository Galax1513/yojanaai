import { cn } from "@/lib/utils"

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-canvas-raised", className)}
      aria-hidden="true"
    />
  )
}

export function SchemeCardSkeleton() {
  return (
    <div className="rounded-lg border border-canvas-line p-5">
      <LoadingSkeleton className="h-4 w-20" />
      <LoadingSkeleton className="mt-4 h-5 w-3/4" />
      <LoadingSkeleton className="mt-3 h-4 w-full" />
      <LoadingSkeleton className="mt-2 h-4 w-2/3" />
      <LoadingSkeleton className="mt-5 h-8 w-28" />
    </div>
  )
}
