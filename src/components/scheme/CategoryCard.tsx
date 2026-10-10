import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import type { CategoryConfig } from "@/data/categories"

export function CategoryCard({ category }: { category: CategoryConfig }) {
  const Icon = category.icon
  return (
    <Link
      to={category.route}
      className="group flex min-h-[220px] flex-col justify-between rounded-md border border-canvas-line p-7 text-left transition-colors duration-200 hover:border-terracotta/40 hover:bg-canvas-raised"
    >
      <div className="flex w-full items-start justify-between">
        <Icon className="size-7 text-terracotta-soft" strokeWidth={1.5} />
        <ArrowUpRight className="size-4 text-mist opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
      <div>
        <p className="font-display text-xl text-sand">{category.name}</p>
        <p className="mt-1.5 text-sm text-mist">{category.description}</p>
      </div>
    </Link>
  )
}
