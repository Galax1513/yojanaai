import { cn } from "@/lib/utils"
import { Check, HelpCircle, X, Info } from "lucide-react"

export type BadgeTone = "positive" | "potential" | "negative" | "neutral" | "notice"

const toneStyles: Record<BadgeTone, string> = {
  positive: "bg-sage/15 text-sage-ink",
  potential: "bg-clay/20 text-clay-ink",
  negative: "bg-rose/20 text-rose-ink",
  neutral: "bg-fg/[0.06] text-muted",
  notice: "bg-tour/15 text-tour-ink",
}

const toneIcon: Record<BadgeTone, React.ReactNode> = {
  positive: <Check className="size-3" strokeWidth={2.5} />,
  potential: <HelpCircle className="size-3" strokeWidth={2.25} />,
  negative: <X className="size-3" strokeWidth={2.5} />,
  neutral: null,
  notice: <Info className="size-3" strokeWidth={2.25} />,
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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {withIcon && toneIcon[tone]}
      {children}
    </span>
  )
}
