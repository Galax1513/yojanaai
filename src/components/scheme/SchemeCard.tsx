import { Link } from "react-router-dom"
import { ArrowUpRight, CalendarClock, MapPin } from "lucide-react"
import type { ApiSchemeListItem } from "@/types/api"
import { getCategoryLabel } from "@/data/categories"
import { cleanSnippet } from "@/lib/utils"

export function SchemeCard({ scheme }: { scheme: ApiSchemeListItem }) {
  const location = scheme.state ?? (scheme.level === "central" ? "All India" : null)

  return (
    <Link
      to={`/scheme/${scheme.slug}`}
      className="glass group flex flex-col rounded-[1.75rem] p-6 transition-transform duration-300 ease-[var(--ease-soft)] hover:-translate-y-1"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-micro truncate">{getCategoryLabel(scheme.category)}</span>
        {location && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fg/[0.06] px-2.5 py-1 text-[11px] text-muted">
            <MapPin className="size-3" />
            {location}
          </span>
        )}
      </div>

      <h3 className="mt-5 line-clamp-2 text-xl font-medium leading-snug tracking-[-0.01em] text-fg">{cleanSnippet(scheme.name)}</h3>
      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">{cleanSnippet(scheme.summary)}</p>
      {scheme.eligibility_summary && (
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-subtle">{cleanSnippet(scheme.eligibility_summary)}</p>
      )}

      <div className="flex-1" />
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div className="min-w-0">
          {scheme.benefit && (
            <>
              <p className="label-micro">Benefit</p>
              <p className="mt-1 line-clamp-1 text-sm font-medium text-accent-ink">{cleanSnippet(scheme.benefit)}</p>
            </>
          )}
          {/* Only ever rendered when the database actually has a
              source-backed deadline — never fabricated. */}
          {scheme.deadline_label && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <CalendarClock className="size-3.5" />
              {scheme.deadline_label}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-colors duration-300 group-hover:border-transparent group-hover:bg-primary group-hover:text-on-primary"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  )
}
