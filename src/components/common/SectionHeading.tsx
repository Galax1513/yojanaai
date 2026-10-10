import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  kicker?: string
  title: React.ReactNode
  description?: string
  align?: "left" | "center"
  tone?: "light" | "dark"
  className?: string
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {kicker && (
        <p
          className={cn(
            "mb-3 text-sm font-medium",
            tone === "light" ? "text-terracotta" : "text-terracotta-soft"
          )}
        >
          {kicker}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-balance text-3xl font-normal leading-[1.15] sm:text-4xl md:text-[2.75rem]",
          tone === "light" ? "text-ink" : "text-sand"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            tone === "light" ? "text-ink-soft" : "text-mist"
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
