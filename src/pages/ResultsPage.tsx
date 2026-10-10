import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pencil, UserPlus, Search } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { SectionHeading } from "@/components/common/SectionHeading"
import { EmptyState } from "@/components/common/EmptyState"
import { EligibilityMatchCard } from "@/components/scheme/EligibilityMatchCard"
import { SupportCategorySelector } from "@/components/scheme/SupportCategorySelector"
import { Button, buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/common/GlassCard"
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
    <div className="min-h-screen pb-28 pt-36 sm:pt-40">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading kicker="Your matches" title="Your benefit matches" tone="dark" />
        <div className="mt-10">
          <EmptyState
            icon={UserPlus}
            title="Build a profile to see personalized matches"
            description="Your matches are based on the information in your profile — we don't have one for you yet. It only takes a few minutes."
            actionLabel="Find My Benefits"
            onAction={() => { window.location.href = "/onboarding" }}
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

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 pt-36 sm:pt-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <SectionHeading
              kicker="Your matches"
              title="Your benefit matches"
              description="Based on the information in your profile."
              tone="dark"
            />
            <Link
              to={`/onboarding?profile=${profileId}`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"}
            >
              <Pencil className="size-3.5" />
              Edit profile
            </Link>
          </div>

          {profile && profileSummaryRows(profile).length > 0 && (
            <GlassCard className="mt-8 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-mist">Your profile</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {profileSummaryRows(profile).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-mist">{label}</dt>
                    <dd className="mt-0.5 text-sm text-sand">{value}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>
          )}

          {/* Shown once the person has any potential matches at all; it
              stays mounted across reloads so the layout doesn't jump. */}
          {taxonomy && unfilteredTotal !== null && unfilteredTotal > 0 && (
            <SupportCategorySelector
              className="mt-6"
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

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-mist">
                <Loader2 className="size-4 animate-spin" />
                Loading your matches…
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
                actionLabel="Explore Schemes"
                onAction={() => { window.location.href = "/discover" }}
              />
            ) : (
              <>
                <p className="text-xs text-mist">
                  {total.toLocaleString("en-IN")} potential match{total === 1 ? "" : "es"}
                  {selectedLabel && unfilteredTotal !== null && (
                    <> in {selectedLabel} · {unfilteredTotal.toLocaleString("en-IN")} across all support</>
                  )}
                </p>

                <div className="mt-6 space-y-16">
                  {matchItems.length > 0 && (
                    <div>
                      <h3 className="font-display text-2xl text-sand">Potential matches</h3>
                      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {matchItems.map((result) => (
                          <EligibilityMatchCard key={result.scheme_id} result={result} />
                        ))}
                      </div>
                    </div>
                  )}

                  {needsInfoItems.length > 0 && (
                    <div>
                      <h3 className="font-display text-2xl text-sand">Need more information</h3>
                      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {needsInfoItems.map((result) => (
                          <EligibilityMatchCard key={result.scheme_id} result={result} />
                        ))}
                      </div>
                    </div>
                  )}
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
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}