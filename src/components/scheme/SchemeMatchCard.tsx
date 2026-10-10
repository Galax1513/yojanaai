import { Link } from "react-router-dom"
import { Check, AlertTriangle, CalendarClock, ArrowRight } from "lucide-react"
import type { SchemeMatch } from "@/types/scheme"
import { StatusBadge } from "@/components/common/StatusBadge"

const statusConfig = {
  eligible: { tone: "positive" as const, label: "Strong Match" },
  potential: { tone: "potential" as const, label: "Potential Match" },
  "not-eligible": { tone: "negative" as const, label: "Needs Attention" },
}

export function SchemeMatchCard({ match }: { match: SchemeMatch }) {
  const config = statusConfig[match.status]

  return (
    <div className="flex flex-col rounded-md border border-canvas-line bg-canvas-raised/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
          <h3 className="mt-3 font-display text-xl text-sand">{match.scheme.name}</h3>
          <p className="mt-1 text-sm text-terracotta-soft">{match.scheme.benefit}</p>
        </div>
        {match.scheme.deadline && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-mist">
            <CalendarClock className="size-3.5" />
            {match.scheme.deadline.label}
          </span>
        )}
      </div>

      {match.matchReason.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-canvas-line pt-4">
          {match.matchReason.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm text-mist">
              <Check className="size-3.5 shrink-0 text-moss-soft" />
              {c.label}
            </div>
          ))}
        </div>
      )}

      {match.needsVerification.length > 0 && (
        <div className={match.matchReason.length > 0 ? "mt-4 space-y-2" : "mt-5 space-y-2 border-t border-canvas-line pt-4"}>
          <p className="text-xs font-medium uppercase tracking-wide text-mist">Needs attention</p>
          {match.needsVerification.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm text-marigold">
              <AlertTriangle className="size-3.5 shrink-0" />
              {c.label}
            </div>
          ))}
        </div>
      )}

      <Link
        to={`/scheme/${match.scheme.id}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand transition-colors hover:text-terracotta-soft"
      >
        View scheme
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
