import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div"
  tone?: "dark" | "light"
}

export function GlassCard({ className, tone = "dark", children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border backdrop-blur-md",
        tone === "dark"
          ? "border-sand/10 bg-canvas-raised/70"
          : "border-ink/10 bg-sand/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
