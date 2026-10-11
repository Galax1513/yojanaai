import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import type { CategoryConfig } from "@/data/categories"

export function CategoryCard({ category }: { category: CategoryConfig }) {
  const Icon = category.icon
  return (
    <Link
      to={category.route}
      className="glass group flex min-h-[15rem] flex-col justify-between rounded-[1.75rem] p-6 transition-transform duration-300 ease-[var(--ease-soft)] hover:-translate-y-1"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/35 text-accent-ink dark:bg-accent/15">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xl font-medium tracking-[-0.01em] text-fg">{category.name}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{category.description}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-colors duration-300 group-hover:border-transparent group-hover:bg-primary group-hover:text-on-primary">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  )
}
