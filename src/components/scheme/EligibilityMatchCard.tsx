import { Link } from "react-router-dom"
import { ArrowRight, Check, HelpCircle } from "lucide-react"
import type { EligibilityResult } from "@/types/api"
import { StatusBadge } from "@/components/common/StatusBadge"
import { getCategoryLabel } from "@/data/categories"

const STATUS_DESCRIPTION: Record<EligibilityResult["status"], string> = {
  MATCH:
    "Based on the information you provided, this scheme appears to match the requirements we could evaluate.",
  NEEDS_INFORMATION:
    "We need more information to determine whether some requirements match your profile.",
  NOT_MATCHED: "", // never rendered — the backend never returns NOT_MATCHED results here
}

/**
 * Renders one scheme's eligibility result. All language here is
 * "potential match" framing, never a claim of official eligibility —
 * see STATUS_DESCRIPTION above. Every explanation shown is a reason
 * string returned by the backend's deterministic evaluation; this
 * component never computes or infers eligibility itself.
 */
export function EligibilityMatchCard({ result }: { result: EligibilityResult }) {
  const { scheme } = result
  const location = scheme.state ?? (scheme.level === "central" ? "All India" : null)

  const matchedReasons = result.evaluations.filter((e) => e.result === "matched")
  const needsInfoReasons = result.evaluations.filter((e) => e.result === "needs_information")

  return (
    <div className="flex flex-col rounded-md border border-canvas-line bg-canvas-raised/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={result.status === "MATCH" ? "positive" : "potential"}>
              Potential match
            </StatusBadge>
            <span className="text-xs font-medium uppercase tracking-wide text-mist">
              {getCategoryLabel(scheme.category)}
            </span>
          </div>
          <h3 className="mt-3 font-display text-xl text-sand">{scheme.name}</h3>
        </div>
        {location && (
          <StatusBadge tone="neutral" withIcon={false} className="shrink-0">
            {location}
          </StatusBadge>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-mist">{STATUS_DESCRIPTION[result.status]}</p>

      {scheme.summary && <p className="mt-3 text-sm leading-relaxed text-mist">{scheme.summary}</p>}
      {scheme.benefit && <p className="mt-3 text-sm font-medium text-terracotta-soft">{scheme.benefit}</p>}

      {matchedReasons.length > 0 && (
        <div className="mt-5 border-t border-canvas-line pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-mist">Why this may match</p>
          <div className="mt-2.5 space-y-2">
            {matchedReasons.map((e) => (
              <div key={e.eligibility_rule_id} className="flex items-start gap-2 text-sm text-sand">
                <Check className="mt-0.5 size-3.5 shrink-0 text-moss-soft" />
                {e.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {needsInfoReasons.length > 0 && (
        <div className="mt-4 border-t border-canvas-line pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-mist">More information needed</p>
          <div className="mt-2.5 space-y-2">
            {needsInfoReasons.map((e) => (
              <div key={e.eligibility_rule_id} className="flex items-start gap-2 text-sm text-marigold">
                <HelpCircle className="mt-0.5 size-3.5 shrink-0" />
                {e.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to={`/scheme/${scheme.slug}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand transition-colors hover:text-terracotta-soft"
      >
        View scheme
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}