import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, AlertTriangle, ChevronDown, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { SectionHeading } from "@/components/common/SectionHeading"
import { SchemeCard } from "@/components/scheme/SchemeCard"
import { SupportCategorySelector } from "@/components/scheme/SupportCategorySelector"
import { EmptyState } from "@/components/common/EmptyState"
import { GlassCard } from "@/components/common/GlassCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Pagination } from "@/components/common/Pagination"
import { SchemeCardSkeleton } from "@/components/common/LoadingSkeleton"
import { cn } from "@/lib/utils"
import { getSchemes } from "@/services/api/schemes"
import { ApiError } from "@/services/api/client"
import { indianStates } from "@/data/statesAndDistricts"
import { useSupportCategories } from "@/hooks/useSupportCategories"
import type { ApiSchemeListItem, ApiSchemeType, ApiSupportFacet } from "@/types/api"

// This phase's entire catalog is bootstrap/unverified data (see
// backend data_source_registry) — shown as a constant rather than
// derived from one page of results, so it stays accurate even when a
// filtered page happens to return zero items.
const CATALOG_IS_DEVELOPMENT_DATA = true

const incomeRanges = [
  { value: "all", label: "Any income" },
  { value: "400000", label: "Under ₹4,00,000" },
  { value: "800000", label: "Under ₹8,00,000" },
]

const schemeTypeLabels: Record<ApiSchemeType, string> = {
  scholarship: "Scholarship",
  subsidy: "Subsidy",
  certification: "Certification",
  pension: "Pension",
  insurance: "Insurance",
  grant: "Grant",
}

const PAGE_SIZE = 20

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")

  // ?category= / ?subcategory= are support-category keys (see
  // backend/app/services/support_taxonomy.py). The homepage's
  // /discover?category=<key> links use keys from the same taxonomy.
  const supportCategory = searchParams.get("category")
  const supportSubcategory = supportCategory ? searchParams.get("subcategory") : null
  const stateParam = searchParams.get("state") ?? "all"
  const incomeParam = searchParams.get("income") ?? "all"
  const typeParam = (searchParams.get("type") as ApiSchemeType | null) ?? "all"
  const searchParam = searchParams.get("search") ?? ""
  const offset = Number(searchParams.get("offset") ?? "0") || 0

  const [items, setItems] = useState<ApiSchemeListItem[]>([])
  const [total, setTotal] = useState(0)
  const [unfilteredTotal, setUnfilteredTotal] = useState<number | null>(null)
  const [facets, setFacets] = useState<ApiSupportFacet[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const taxonomy = useSupportCategories()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  // Debounce the search box so every keystroke doesn't fire a request —
  // syncs into the URL (and therefore the fetch below) after a pause.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === searchParam) return
      const next = new URLSearchParams(searchParams)
      if (searchInput) next.set("search", searchInput)
      else next.delete("search")
      next.delete("offset") // a new search starts back at page 1
      setSearchParams(next, { replace: true })
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)

    getSchemes({
      support_category: supportCategory ?? undefined,
      support_subcategory: supportSubcategory ?? undefined,
      state: stateParam === "all" ? undefined : stateParam,
      scheme_type: typeParam === "all" ? undefined : typeParam,
      income: incomeParam === "all" ? undefined : Number(incomeParam),
      search: searchParam || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((res) => {
        if (thisRequest !== requestId.current) return // a newer request superseded this one
        setItems(res.items)
        setTotal(res.total)
        setUnfilteredTotal(res.unfiltered_total)
        setFacets(res.support_facets)
      })
      .catch((err: unknown) => {
        if (thisRequest !== requestId.current) return
        setError(err instanceof ApiError ? err.message : "We couldn't load schemes right now. Please try again.")
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (thisRequest === requestId.current) setLoading(false)
      })
  }, [supportCategory, supportSubcategory, stateParam, typeParam, incomeParam, searchParam, offset])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value === "all") next.delete(key)
    else next.set(key, value)
    next.delete("offset") // any filter change resets to page 1
    setSearchParams(next, { replace: true })
  }

  const setSupportFilter = (category: string | null, subcategory: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (category) next.set("category", category)
    else next.delete("category")
    if (category && subcategory) next.set("subcategory", subcategory)
    else next.delete("subcategory")
    next.delete("offset")
    setSearchParams(next, { replace: true })
  }

  const goToOffset = (nextOffset: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextOffset === 0) next.delete("offset")
    else next.set("offset", String(nextOffset))
    setSearchParams(next, { replace: true })
    window.scrollTo({ top: 0 })
  }

  const clearAll = () => {
    setSearchInput("")
    setSearchParams({}, { replace: true })
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <PageTransition>
      <div className="min-h-screen px-3 pb-16 pt-32 sm:px-5 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              as="h1"
              kicker="Discover"
              title="Explore schemes"
              description="Browse central and state schemes by category, eligibility requirements, and benefit type. No account required."
            />
            {CATALOG_IS_DEVELOPMENT_DATA && (
              <StatusBadge tone="notice" className="w-fit shrink-0">
                Development data — not verified government records
              </StatusBadge>
            )}
          </div>

          <GlassCard className="mt-10 flex flex-col gap-2 p-2 lg:flex-row lg:items-center lg:rounded-full">
            <label className="relative flex-1">
              <span className="sr-only">Search schemes</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, benefit or keyword"
                className="h-12 w-full rounded-full border border-transparent bg-field pl-12 pr-4 text-[15px] text-fg placeholder:text-subtle focus:border-accent-strong focus:outline-none focus:ring-4 focus:ring-accent/25"
              />
            </label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <PillSelect label="Scheme type" value={typeParam} onChange={(v) => setParam("type", v)}>
                <option value="all">Any type</option>
                {(Object.keys(schemeTypeLabels) as ApiSchemeType[]).map((t) => (
                  <option key={t} value={t}>{schemeTypeLabels[t]}</option>
                ))}
              </PillSelect>
              <PillSelect label="State" value={stateParam} onChange={(v) => setParam("state", v)}>
                <option value="all">All states</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </PillSelect>
              <PillSelect label="Income limit" value={incomeParam} onChange={(v) => setParam("income", v)}>
                {incomeRanges.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </PillSelect>
            </div>
          </GlassCard>

          {taxonomy && (
            <SupportCategorySelector
              className="mt-4"
              taxonomy={taxonomy}
              facets={facets}
              unfilteredTotal={unfilteredTotal}
              category={supportCategory}
              subcategory={supportSubcategory}
              onChange={setSupportFilter}
              title="What are you looking for?"
              description="Choose an area to narrow the catalog. Counts reflect your other filters too."
            />
          )}

          <div className="mt-12 flex min-h-12 items-end justify-between gap-4" aria-live="polite">
            {loading ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Loading schemes…
              </p>
            ) : (
              !error && (
                <p className="flex items-baseline gap-2.5">
                  <span className="font-display text-4xl font-light tracking-[-0.03em] text-fg sm:text-5xl">
                    {total.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-muted">scheme{total === 1 ? "" : "s"} found</span>
                </p>
              )
            )}
          </div>

          <div className="mt-6">
            {error ? (
              <EmptyState
                icon={AlertTriangle}
                title="We couldn't load schemes right now."
                description={supportCategory ? error : "Please try again."}
                actionLabel={supportCategory ? "Clear filters" : "Retry"}
                onAction={
                  supportCategory
                    ? clearAll
                    : () => setSearchParams(new URLSearchParams(searchParams), { replace: true })
                }
              />
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SchemeCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((scheme) => (
                    <SchemeCard key={scheme.id} scheme={scheme} />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => goToOffset(Math.max(0, offset - PAGE_SIZE))}
                  onNext={() => goToOffset(offset + PAGE_SIZE)}
                />
              </>
            ) : (
              <EmptyState
                icon={Search}
                title="No schemes match your current filters."
                description="Try a different keyword or clear your filters."
                actionLabel="Clear filters"
                onAction={clearAll}
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function PillSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 max-w-56 appearance-none truncate rounded-full border bg-field pl-4 pr-10 text-sm text-fg focus:border-accent-strong focus:outline-none focus:ring-4 focus:ring-accent/25",
          value !== "all" ? "border-accent-strong" : "border-transparent"
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </label>
  )
}
