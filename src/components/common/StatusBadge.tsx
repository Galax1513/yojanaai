import { cn } from "@/lib/utils"
import { Check, Clock, X, AlertTriangle } from "lucide-react"

export type BadgeTone = "positive" | "potential" | "negative" | "neutral"

const toneStyles: Record<BadgeTone, string> = {
  positive: "bg-moss/15 text-moss-soft border-moss/30",
  potential: "bg-marigold/15 text-marigold border-marigold/30",
  negative: "bg-rose/15 text-rose border-rose/30",
  neutral: "bg-mist/10 text-mist border-mist/25",
}

const toneIcon: Record<BadgeTone, React.ReactNode> = {
  positive: <Check className="size-3" />,
  potential: <Clock className="size-3" />,
  negative: <X className="size-3" />,
  neutral: <AlertTriangle className="size-3" />,
}

interface StatusBadgeProps {
  tone: BadgeTone
  children: React.ReactNode
  className?: string
  withIcon?: boolean
}

export function StatusBadge({ tone, children, className, withIcon = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {withIcon && toneIcon[tone]}
      {children}
    </span>
  )
}
