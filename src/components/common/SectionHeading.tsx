import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  kicker?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  /** Heading level — pages use h1 for their main title. */
  as?: "h1" | "h2"
  className?: string
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker && <p className="label-micro mb-4 text-accent-ink">{kicker}</p>}
      <Tag
        className={cn(
          "text-balance font-light leading-[1.05] text-fg",
          Tag === "h1" ? "text-[2.6rem] sm:text-6xl" : "text-[2.15rem] sm:text-5xl"
        )}
      >
        {title}
      </Tag>
      {description && (
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">{description}</p>
      )}
    </div>
  )
}
