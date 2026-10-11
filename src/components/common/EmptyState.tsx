import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/common/GlassCard"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  /** Either a click handler or an in-app route for the action. */
  onAction?: () => void
  actionTo?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionTo }: EmptyStateProps) {
  return (
    <GlassCard className="flex flex-col items-center px-8 py-16 text-center sm:py-20">
      <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-fg/[0.06]">
        <Icon className="size-5 text-muted" strokeWidth={1.75} />
      </div>
      <h3 className="text-2xl font-normal text-fg">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-7" })}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <Button variant="outline" size="sm" className="mt-7" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </GlassCard>
  )
}
