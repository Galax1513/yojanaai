import {
  Accessibility,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  LayoutGrid,
  Shield,
  Sprout,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { GlassCard } from "@/components/common/GlassCard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ApiSupportCategory, ApiSupportFacet } from "@/types/api"

const icons: Record<string, LucideIcon> = {
  education: GraduationCap,
  employment: Briefcase,
  business: Store,
  agriculture: Sprout,
  healthcare: HeartPulse,
  housing: Home,
  women: Users,
  disability: Accessibility,
  "family-social-security": Shield,
  financial: Landmark,
}

interface SupportCategorySelectorProps {
  /** Labels and structure, from GET /api/schemes/support-categories. */
  taxonomy: ApiSupportCategory[]
  /** Real per-option counts from the list response; null before the
   * first response arrives (counts are then simply not shown). */
  facets: ApiSupportFacet[] | null
  /** The "All support" count — the list's unfiltered_total. */
  unfilteredTotal: number | null
  category: string | null
  subcategory: string | null
  onChange: (category: string | null, subcategory: string | null) => void
  title: string
  description: string
  className?: string
}

function formatCount(n: number | undefined): string | null {
  return n === undefined ? null : n.toLocaleString("en-IN")
}

export function SupportCategorySelector({
  taxonomy,
  facets,
  unfilteredTotal,
  category,
  subcategory,
  onChange,
  title,
  description,
  className,
}: SupportCategorySelectorProps) {
  const facetFor = (key: string) => facets?.find((f) => f.category === key)
  const selected = taxonomy.find((c) => c.key === category) ?? null
  const selectedFacet = selected ? facetFor(selected.key) : undefined

  return (
    <GlassCard className={cn("p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-sand">{title}</h2>
          <p className="mt-1 text-sm text-mist">{description}</p>
        </div>
        {selected && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null, null)} className="gap-1.5">
            <X className="size-3.5" />
            Clear filter
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <CategoryOption
          label="All support"
          icon={LayoutGrid}
          count={unfilteredTotal ?? undefined}
          selected={!selected}
          onClick={() => onChange(null, null)}
        />
        {taxonomy.map((c) => {
          const count = facetFor(c.key)?.count
          return (
            <CategoryOption
              key={c.key}
              label={c.label}
              icon={icons[c.key] ?? LayoutGrid}
              count={count}
              selected={selected?.key === c.key}
              // An option with nothing in it can't be chosen — except
              // when it's already selected (e.g. restored from the URL),
              // so the state stays visible and clearable.
              disabled={count === 0 && selected?.key !== c.key}
              onClick={() => onChange(c.key, null)}
            />
          )
        })}
      </div>

      {selected && selected.subcategories.length > 0 && (
        <div className="mt-5 border-t border-canvas-line pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-mist">
            Narrow within {selected.label}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SubcategoryOption
              label={`All ${selected.label.toLowerCase()}`}
              count={selectedFacet?.count}
              selected={!subcategory}
              onClick={() => onChange(selected.key, null)}
            />
            {selected.subcategories.map((s) => {
              const count = selectedFacet?.subcategories.find((f) => f.subcategory === s.key)?.count
              return (
                <SubcategoryOption
                  key={s.key}
                  label={s.label}
                  count={count}
                  selected={subcategory === s.key}
                  disabled={count === 0 && subcategory !== s.key}
                  onClick={() => onChange(selected.key, s.key)}
                />
              )
            })}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function CategoryOption({
  label,
  icon: Icon,
  count,
  selected,
  disabled,
  onClick,
}: {
  label: string
  icon: LucideIcon
  count: number | undefined
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-terracotta bg-terracotta/10"
          : "border-canvas-line hover:border-sand/30",
        disabled && "cursor-not-allowed opacity-40 hover:border-canvas-line"
      )}
    >
      <Icon className={cn("size-4 shrink-0", selected ? "text-terracotta-soft" : "text-mist")} />
      <span className={cn("min-w-0 flex-1 text-sm", selected ? "text-sand" : "text-sand/90")}>{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-mist">{formatCount(count)}</span>
      )}
    </button>
  )
}

function SubcategoryOption({
  label,
  count,
  selected,
  disabled,
  onClick,
}: {
  label: string
  count: number | undefined
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
        selected
          ? "border-terracotta bg-terracotta/10 text-sand"
          : "border-canvas-line text-sand/90 hover:border-sand/30",
        disabled && "cursor-not-allowed opacity-40 hover:border-canvas-line"
      )}
    >
      {label}
      {count !== undefined && <span className="text-xs tabular-nums text-mist">{formatCount(count)}</span>}
    </button>
  )
}
