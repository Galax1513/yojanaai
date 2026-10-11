import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/common/GlassCard"

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-full", className)} aria-hidden="true" />
}

export function SchemeCardSkeleton() {
  return (
    <GlassCard className="p-6" aria-hidden="true">
      <LoadingSkeleton className="h-3 w-24" />
      <LoadingSkeleton className="mt-6 h-5 w-4/5" />
      <LoadingSkeleton className="mt-3 h-5 w-3/5" />
      <LoadingSkeleton className="mt-6 h-3 w-full" />
      <LoadingSkeleton className="mt-2.5 h-3 w-2/3" />
      <div className="mt-10 flex items-center justify-between">
        <LoadingSkeleton className="h-3 w-28" />
        <LoadingSkeleton className="size-10" />
      </div>
    </GlassCard>
  )
}
