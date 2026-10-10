import { Link } from "react-router-dom"
import { ArrowRight, CalendarClock } from "lucide-react"
import type { ApiSchemeListItem } from "@/types/api"
import { StatusBadge } from "@/components/common/StatusBadge"
import { getCategoryLabel } from "@/data/categories"

export function SchemeCard({ scheme }: { scheme: ApiSchemeListItem }) {
  const location = scheme.state ?? (scheme.level === "central" ? "All India" : null)

  return (
    <div className="flex flex-col justify-between rounded-md border border-canvas-line p-6 transition-colors duration-200 hover:border-terracotta/40 hover:bg-canvas-raised">
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-mist">
          {getCategoryLabel(scheme.category)}
        </span>
        <h3 className="mt-3 font-display text-xl text-sand">{scheme.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mist">{scheme.summary}</p>
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-mist/80">
          {scheme.eligibility_summary}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-canvas-line pt-4">
        <div>
          <p className="line-clamp-1 text-sm font-medium text-terracotta-soft">{scheme.benefit}</p>
          {/* Only ever rendered when the database actually has a
              source-backed deadline — never fabricated. */}
          {scheme.deadline_label && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-mist">
              <CalendarClock className="size-3.5" />
              {scheme.deadline_label}
            </p>
          )}
        </div>
        {location && (
          <StatusBadge tone="neutral" withIcon={false} className="shrink-0">
            {location}
          </StatusBadge>
        )}
      </div>

      <Link
        to={`/scheme/${scheme.slug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sand transition-colors hover:text-terracotta-soft"
      >
        View scheme
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
