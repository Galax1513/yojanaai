import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** "strong" is denser, for panels that float over busy content. */
  variant?: "default" | "strong"
}

export function GlassCard({ className, variant = "default", children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem]",
        variant === "strong" ? "glass-strong" : "glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
