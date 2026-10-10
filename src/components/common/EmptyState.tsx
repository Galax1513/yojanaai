import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-canvas-line px-8 py-16 text-center">
      <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-canvas-raised">
        <Icon className="size-5 text-mist" />
      </div>
      <h3 className="font-display text-xl text-sand">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist">{description}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
