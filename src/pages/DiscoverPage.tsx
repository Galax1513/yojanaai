import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, FlaskConical, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { SectionHeading } from "@/components/common/SectionHeading"
import { SchemeCard } from "@/components/scheme/SchemeCard"
import { SupportCategorySelector } from "@/components/scheme/SupportCategorySelector"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
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
      <div className="min-h-screen pb-28 pt-36 sm:pt-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              kicker="Discover"
              title="Explore government schemes"
              description="Browse schemes by category, eligibility requirements, and benefit type — no account required."
              tone="dark"
            />
            {CATALOG_IS_DEVELOPMENT_DATA && (
              <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-marigold/30 bg-marigold/10 px-3 py-1.5 text-xs font-medium text-marigold">
                <FlaskConical className="size-3.5" />
                Development data — not verified government records
              </span>
            )}
          </div>

          {taxonomy && (
            <SupportCategorySelector
              className="mt-10"
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

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search schemes"
                className="h-11 w-full rounded-md border border-canvas-line bg-canvas-raised pl-10 pr-4 text-sm text-sand placeholder:text-mist focus:border-terracotta/50 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={typeParam}
                onChange={(e) => setParam("type", e.target.value)}
                className="h-10 rounded-md border border-canvas-line bg-canvas-raised px-3 text-xs text-sand focus:border-terracotta/50 focus:outline-none"
              >
                <option value="all">Any scheme type</option>
                {(Object.keys(schemeTypeLabels) as ApiSchemeType[]).map((t) => (
                  <option key={t} value={t}>{schemeTypeLabels[t]}</option>
                ))}
              </select>

              <select
                value={stateParam}
                onChange={(e) => setParam("state", e.target.value)}
                className="h-10 rounded-md border border-canvas-line bg-canvas-raised px-3 text-xs text-sand focus:border-terracotta/50 focus:outline-none"
              >
                <option value="all">All states</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={incomeParam}
                onChange={(e) => setParam("income", e.target.value)}
                className="h-10 rounded-md border border-canvas-line bg-canvas-raised px-3 text-xs text-sand focus:border-terracotta/50 focus:outline-none"
              >
                {incomeRanges.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-mist">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" /> Loading schemes…
                </span>
              ) : (
                !error && `${total.toLocaleString("en-IN")} scheme${total === 1 ? "" : "s"} found`
              )}
            </p>
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-md border border-canvas-line bg-canvas-raised/40" />
                ))}
              </div>
            ) : items.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((scheme) => (
                    <SchemeCard key={scheme.id} scheme={scheme} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => goToOffset(Math.max(0, offset - PAGE_SIZE))}
                      className="gap-1.5"
                    >
                      <ChevronLeft className="size-3.5" />
                      Previous
                    </Button>
                    <span className="text-xs text-mist">
                      Page {currentPage} of {totalPages.toLocaleString("en-IN")}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToOffset(offset + PAGE_SIZE)}
                      className="gap-1.5"
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                )}
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
