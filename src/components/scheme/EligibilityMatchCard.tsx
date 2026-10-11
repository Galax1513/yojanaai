import { Link } from "react-router-dom"
import { ArrowUpRight, Check, HelpCircle, MapPin } from "lucide-react"
import type { EligibilityResult } from "@/types/api"
import { StatusBadge } from "@/components/common/StatusBadge"
import { getCategoryLabel } from "@/data/categories"
import { cleanSnippet } from "@/lib/utils"

const STATUS_COPY: Record<EligibilityResult["status"], { badge: string; description: string }> = {
  MATCH: {
    badge: "Potential match",
    description:
      "Based on the information you provided, this scheme appears to match the requirements we could evaluate.",
  },
  NEEDS_INFORMATION: {
    badge: "May be eligible",
    description: "We need more information to determine whether some requirements match your profile.",
  },
  NOT_MATCHED: { badge: "", description: "" }, // never rendered — the backend never returns NOT_MATCHED results here
}

/**
 * Renders one scheme's eligibility result. All language here is
 * "potential match" framing, never a claim of official eligibility —
 * see STATUS_COPY above. Every explanation shown is a reason string
 * returned by the backend's deterministic evaluation; this component
 * never computes or infers eligibility itself.
 */
export function EligibilityMatchCard({ result }: { result: EligibilityResult }) {
  const { scheme } = result
  const location = scheme.state ?? (scheme.level === "central" ? "All India" : null)
  const copy = STATUS_COPY[result.status]

  const matchedReasons = result.evaluations.filter((e) => e.result === "matched")
  const needsInfoReasons = result.evaluations.filter((e) => e.result === "needs_information")

  return (
    <article className="glass flex flex-col rounded-[1.75rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge tone={result.status === "MATCH" ? "positive" : "potential"}>{copy.badge}</StatusBadge>
        {location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-fg/[0.06] px-2.5 py-1 text-[11px] text-muted">
            <MapPin className="size-3" />
            {location}
          </span>
        )}
      </div>

      <p className="label-micro mt-5">{getCategoryLabel(scheme.category)}</p>
      <h3 className="mt-2 text-xl font-medium leading-snug tracking-[-0.01em] text-fg">{cleanSnippet(scheme.name)}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{copy.description}</p>
      {scheme.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{cleanSnippet(scheme.summary)}</p>}
      {scheme.benefit && <p className="mt-3 text-sm font-medium text-accent-ink line-clamp-2">{cleanSnippet(scheme.benefit)}</p>}

      {matchedReasons.length > 0 && (
        <div className="mt-5 rounded-2xl bg-fg/[0.035] p-4">
          <p className="label-micro">Why this may match</p>
          <ul className="mt-3 space-y-2.5">
            {matchedReasons.map((e) => (
              <li key={e.eligibility_rule_id} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-sage/15">
                  <Check className="size-3 text-sage-ink" strokeWidth={2.5} />
                </span>
                {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsInfoReasons.length > 0 && (
        <div className="mt-3 rounded-2xl bg-clay/10 p-4">
          <p className="label-micro">More information needed</p>
          <ul className="mt-3 space-y-2.5">
            {needsInfoReasons.map((e) => (
              <li key={e.eligibility_rule_id} className="flex items-start gap-2.5 text-sm text-clay-ink">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-clay/20">
                  <HelpCircle className="size-3" strokeWidth={2.25} />
                </span>
                {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1" />
      <Link
        to={`/scheme/${scheme.slug}`}
        className="group mt-6 inline-flex items-center gap-3 self-start text-sm font-medium text-fg"
      >
        <span className="flex size-9 items-center justify-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-transparent group-hover:bg-primary group-hover:text-on-primary">
          <ArrowUpRight className="size-4" />
        </span>
        View scheme
      </Link>
    </article>
  )
}
