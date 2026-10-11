import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { AlertTriangle, Pencil, UserPlus, Search } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { SectionHeading } from "@/components/common/SectionHeading"
import { EmptyState } from "@/components/common/EmptyState"
import { EligibilityMatchCard } from "@/components/scheme/EligibilityMatchCard"
import { SupportCategorySelector } from "@/components/scheme/SupportCategorySelector"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/common/GlassCard"
import { Pagination } from "@/components/common/Pagination"
import { LoadingSkeleton, SchemeCardSkeleton } from "@/components/common/LoadingSkeleton"
import { cn } from "@/lib/utils"
import { getProfile } from "@/services/api/profiles"
import { useAuth } from "@/contexts/AuthContext"
import { getProfileMatches } from "@/services/api/eligibility"
import { ApiError } from "@/services/api/client"
import { useSupportCategories } from "@/hooks/useSupportCategories"
import type { ApiProfile, ApiSupportFacet, EligibilityResult } from "@/types/api"

const PAGE_SIZE = 20

function profileSummaryRows(profile: ApiProfile): [string, string][] {
  const rows: [string, string | null | undefined][] = [
    ["Age", profile.age != null ? String(profile.age) : null],
    ["Gender", profile.gender],
    ["State", profile.state],
    ["Area type", profile.area_type],
    ["Social category", profile.social_category],
    ["BPL status", profile.bpl_status],
    [
      "Annual family income",
      profile.annual_family_income != null
        ? `₹${profile.annual_family_income.toLocaleString("en-IN")}`
        : null,
    ],
  ]
  return rows.filter((r): r is [string, string] => !!r[1])
}

function NoProfileState() {
  return (
    <div className="min-h-screen px-3 pb-16 pt-32 sm:px-5 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <SectionHeading as="h1" kicker="Your matches" title="Your benefit matches" />
        <div className="mt-10">
          <EmptyState
            icon={UserPlus}
            title="Build a profile to see personalized matches"
            description="Your matches are based on the information in your profile — we don't have one for you yet. It only takes a few minutes."
            actionLabel="Find My Benefits"
            actionTo="/onboarding"
          />
        </div>
      </div>
    </div>
  )
}

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  // A returning, signed-in person lands here without ?profile= — fall
  // back to the profile saved on their account.
  const profileId = searchParams.get("profile") ?? user?.profile_id ?? null
  const offset = Number(searchParams.get("offset") ?? "0") || 0
  // The kind of support being looked for — narrows the list only; the
  // profile alone decides eligibility.
  const supportCategory = searchParams.get("category")
  const supportSubcategory = supportCategory ? searchParams.get("subcategory") : null
  const taxonomy = useSupportCategories()

  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [items, setItems] = useState<EligibilityResult[]>([])
  const [total, setTotal] = useState(0)
  const [unfilteredTotal, setUnfilteredTotal] = useState<number | null>(null)
  const [facets, setFacets] = useState<ApiSupportFacet[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getProfile(profileId),
      getProfileMatches(profileId, PAGE_SIZE, offset, {
        support_category: supportCategory ?? undefined,
        support_subcategory: supportSubcategory ?? undefined,
      }),
    ])
      .then(([profileRes, matchesRes]) => {
        if (cancelled) return
        setProfile(profileRes.profile)
        setItems(matchesRes.items)
        setTotal(matchesRes.total)
        setUnfilteredTotal(matchesRes.unfiltered_total)
        setFacets(matchesRes.support_facets)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof ApiError && err.status === 404
            ? "We couldn't find that profile. It may have been removed."
            : "We couldn't load your matches right now. Please try again."
        )
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profileId, offset, supportCategory, supportSubcategory, reloadKey])

  if (!profileId) {
    return (
      <PageTransition>
        <NoProfileState />
      </PageTransition>
    )
  }

  const setSupportFilter = (category: string | null, subcategory: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (category) next.set("category", category)
    else next.delete("category")
    if (category && subcategory) next.set("subcategory", subcategory)
    else next.delete("subcategory")
    next.delete("offset") // a new filter starts back at page 1
    setSearchParams(next, { replace: true })
  }

  const selectedLabel = (() => {
    const category = taxonomy?.find((c) => c.key === supportCategory)
    if (!category) return null
    return category.subcategories.find((s) => s.key === supportSubcategory)?.label ?? category.label
  })()

  const goToOffset = (nextOffset: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextOffset === 0) next.delete("offset")
    else next.set("offset", String(nextOffset))
    setSearchParams(next, { replace: true })
    window.scrollTo({ top: 0 })
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const matchItems = items.filter((i) => i.status === "MATCH")
  const needsInfoItems = items.filter((i) => i.status === "NEEDS_INFORMATION")

  const summaryRows = profile ? profileSummaryRows(profile) : []

  return (
    <PageTransition>
      <div className="min-h-screen px-3 pb-16 pt-32 sm:px-5 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <GlassCard className="flex flex-col justify-between p-7 sm:p-9">
              <div>
                <p className="label-micro text-accent-ink">Your matches</p>
                <h1 className="mt-3 text-4xl font-light leading-[1.05] text-fg sm:text-5xl">
                  {profile?.name ? `Hello, ${profile.name.split(" ")[0]}` : "Your benefit matches"}
                </h1>
                <p className="mt-3 text-sm text-muted">Based on the information in your profile.</p>
              </div>
              <div className="mt-10 flex items-end justify-between gap-4">
                <div aria-live="polite">
                  {unfilteredTotal !== null ? (
                    <>
                      <p className="font-display text-6xl font-light leading-none tracking-[-0.04em] text-fg sm:text-7xl">
                        {unfilteredTotal.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        potential match{unfilteredTotal === 1 ? "" : "es"} across all support
                      </p>
                    </>
                  ) : error ? (
                    <p className="text-sm text-muted">Match count unavailable</p>
                  ) : (
                    <LoadingSkeleton className="h-14 w-32" />
                  )}
                </div>
                <Link
                  to={`/onboarding?profile=${profileId}`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "h-10" })}
                >
                  <Pencil className="size-3.5" />
                  Edit profile
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-7 sm:p-9">
              <p className="label-micro">Your profile</p>
              {summaryRows.length > 0 ? (
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                  {summaryRows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="label-micro">{label}</dt>
                      <dd className="mt-1.5 text-[15px] text-fg">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <LoadingSkeleton className="h-2.5 w-16" />
                      <LoadingSkeleton className="mt-3 h-4 w-24" />
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
                Results are potential matches only, based on the details you provided. Always confirm
                eligibility on the official scheme website before applying.
              </p>
            </GlassCard>
          </div>

          {/* Shown once the person has any potential matches at all; it
              stays mounted across reloads so the layout doesn't jump. */}
          {taxonomy && unfilteredTotal !== null && unfilteredTotal > 0 && (
            <SupportCategorySelector
              className="mt-4"
              taxonomy={taxonomy}
              facets={facets}
              unfilteredTotal={unfilteredTotal}
              category={supportCategory}
              subcategory={supportSubcategory}
              onChange={setSupportFilter}
              title="What kind of support are you looking for?"
              description="Choose an area to narrow your results."
            />
          )}

          <div className="mt-12">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SchemeCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertTriangle}
                title="We couldn't load your matches right now."
                description={error}
                actionLabel={supportCategory ? "Clear filter" : "Retry"}
                onAction={() => (supportCategory ? setSupportFilter(null, null) : setReloadKey((k) => k + 1))}
              />
            ) : total === 0 && supportCategory && unfilteredTotal ? (
              <EmptyState
                icon={Search}
                title={`No potential matches in ${selectedLabel ?? "this area"}`}
                description="None of your potential matches fall under this kind of support. Try another area, or clear the filter to see all of them."
                actionLabel="Clear filter"
                onAction={() => setSupportFilter(null, null)}
              />
            ) : total === 0 ? (
              <EmptyState
                icon={Search}
                title="No potential matches yet"
                description="We couldn't find any schemes that match the information in your profile so far. Adding more details may help — or browse the full catalog yourself."
                actionLabel="Explore schemes"
                actionTo="/discover"
              />
            ) : (
              <>
                {selectedLabel && (
                  <p className="mb-8 text-sm text-muted">
                    <span className="font-medium text-fg">{total.toLocaleString("en-IN")}</span> potential match
                    {total === 1 ? "" : "es"} in {selectedLabel}
                  </p>
                )}

                <div className="space-y-16">
                  {matchItems.length > 0 && (
                    <ResultGroup
                      title="Potential matches"
                      description="These appear to meet the requirements we could check."
                      tone="match"
                      count={matchItems.length}
                    >
                      {matchItems.map((result) => (
                        <EligibilityMatchCard key={result.scheme_id} result={result} />
                      ))}
                    </ResultGroup>
                  )}

                  {needsInfoItems.length > 0 && (
                    <ResultGroup
                      title="May be eligible"
                      description="Some requirements need details your profile doesn't have yet."
                      tone="info"
                      count={needsInfoItems.length}
                    >
                      {needsInfoItems.map((result) => (
                        <EligibilityMatchCard key={result.scheme_id} result={result} />
                      ))}
                    </ResultGroup>
                  )}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => goToOffset(Math.max(0, offset - PAGE_SIZE))}
                  onNext={() => goToOffset(offset + PAGE_SIZE)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function ResultGroup({
  title,
  description,
  tone,
  count,
  children,
}: {
  title: string
  description: string
  tone: "match" | "info"
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-normal text-fg">
            <span className={cn("size-2.5 rounded-full", tone === "match" ? "bg-sage" : "bg-clay")} />
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <span className="shrink-0 text-sm text-muted">
          {count} on this page
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}
