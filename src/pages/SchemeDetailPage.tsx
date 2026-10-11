import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, ExternalLink, Search, AlertTriangle, Loader2, MapPin } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DocumentStatusRow } from "@/components/scheme/DocumentStatus"
import { GlassCard } from "@/components/common/GlassCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/common/EmptyState"
import { getScheme } from "@/services/api/schemes"
import { ApiError } from "@/services/api/client"
import { getCategoryLabel } from "@/data/categories"
import type { ApiSchemeDetail } from "@/types/api"
import { cleanSnippet, cleanText } from "@/lib/utils"

export function SchemeDetailPage() {
  const { id: slug } = useParams<{ id: string }>()
  const [scheme, setScheme] = useState<ApiSchemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<"not-found" | "error" | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    getScheme(slug)
      .then(setScheme)
      .catch((err: unknown) => {
        setError(err instanceof ApiError && err.status === 404 ? "not-found" : "error")
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center pt-20">
          <Loader2 className="size-5 animate-spin text-muted" />
        </div>
      </PageTransition>
    )
  }

  if (error === "error") {
    return (
      <PageTransition>
        <div className="min-h-screen px-3 pb-16 pt-36 sm:px-5 sm:pt-40">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              icon={AlertTriangle}
              title="We couldn't load this scheme right now."
              description="Please try again."
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error === "not-found" || !scheme) {
    return (
      <PageTransition>
        <div className="min-h-screen px-3 pb-16 pt-36 sm:px-5 sm:pt-40">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              icon={Search}
              title="Scheme not found"
              description="This scheme may have been removed or the link is incorrect."
              actionLabel="Back to Discover"
              actionTo="/discover"
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  const location = scheme.state ?? (scheme.level === "central" ? "All India" : null)
  const officialUrl = scheme.official_application_url ?? scheme.official_source_url

  return (
    <PageTransition>
      <div className="min-h-screen px-3 pb-16 pt-28 sm:px-5 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/discover"
            className="group inline-flex items-center gap-2.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <span className="glass flex size-9 items-center justify-center rounded-full">
              <ArrowLeft className="size-4" />
            </span>
            Back to Discover
          </Link>

          <GlassCard className="mt-6 overflow-hidden p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="neutral" withIcon={false}>
                {getCategoryLabel(scheme.category)}
              </StatusBadge>
              {location && (
                <StatusBadge tone="neutral" withIcon={false} className="gap-1">
                  <MapPin className="size-3" />
                  {location}
                </StatusBadge>
              )}
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.1rem] font-light leading-[1.08] text-fg sm:text-5xl">
              {cleanSnippet(scheme.name)}
            </h1>
            {scheme.benefit && (
              <div className="mt-6 inline-flex max-w-full flex-col rounded-2xl bg-accent/30 px-5 py-3 dark:bg-accent/10">
                <span className="label-micro">Benefit</span>
                <span className="mt-1 text-lg text-fg">{cleanSnippet(scheme.benefit)}</span>
              </div>
            )}
          </GlassCard>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <GlassCard className="p-7 sm:p-10">
              <div className="space-y-10">
                <DetailSection title="Overview">
                  <p className="whitespace-pre-line">{cleanText(scheme.description || scheme.summary)}</p>
                </DetailSection>

                {scheme.benefits && (
                  <DetailSection title="Benefits">
                    <p className="whitespace-pre-line text-fg">{cleanText(scheme.benefits)}</p>
                  </DetailSection>
                )}

                <DetailSection title="Who can apply">
                  <p className="whitespace-pre-line">{cleanText(scheme.who_can_apply)}</p>
                </DetailSection>

                <DetailSection title="Eligibility requirements">
                  <p className="whitespace-pre-line">{cleanText(scheme.eligibility_summary)}</p>
                </DetailSection>

                <DetailSection title="Documents you may need when applying">
                  <p className="text-xs">
                    Listed for your information — you don't upload anything to YojanaAI. They may be
                    required when you apply through the official government portal.
                  </p>
                  {scheme.required_documents.length > 0 ? (
                    <div className="mt-5 rounded-2xl bg-fg/[0.035] p-5">
                      {scheme.required_documents.map((doc) => (
                        <DocumentStatusRow key={doc.id} document={doc} />
                      ))}
                    </div>
                  ) : scheme.documents_required_raw ? (
                    <p className="mt-4 whitespace-pre-line">{cleanText(scheme.documents_required_raw)}</p>
                  ) : (
                    <p className="mt-4">No document list available from the source.</p>
                  )}
                </DetailSection>

                {scheme.application_process.length > 0 && (
                  <DetailSection title="Application process">
                    <ol className="space-y-4">
                      {scheme.application_process.map((step, i) => (
                        <li key={step} className="flex gap-4">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong font-display text-sm font-medium text-fg">
                            {i + 1}
                          </span>
                          <span className="pt-1">{cleanSnippet(step)}</span>
                        </li>
                      ))}
                    </ol>
                  </DetailSection>
                )}
              </div>
            </GlassCard>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <GlassCard className="p-6">
                <p className="label-micro">Official source</p>
                <p className="mt-3 text-[15px] text-fg">
                  {scheme.official_source_label ?? scheme.ministry ?? "Not specified by the source"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {scheme.data_status === "verified" && scheme.last_verified_at
                    ? `Last verified ${new Date(scheme.last_verified_at).toLocaleDateString("en-IN")}`
                    : "This record hasn't been independently verified against the official source yet."}
                </p>

                {/* Never invented — only rendered when the database actually
                    has the URL. Official application URL takes priority;
                    falls back to the general source page. */}
                {officialUrl ? (
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "primary", className: "mt-6 w-full" })}
                  >
                    {scheme.official_application_url ? "Apply on official website" : "View official scheme details"}
                    <ExternalLink />
                  </a>
                ) : (
                  <Button variant="outline" className="mt-6 w-full" disabled>
                    No official link on file
                  </Button>
                )}
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  You'll leave YojanaAI and apply directly on the official government portal. YojanaAI
                  doesn't process applications or collect application documents.
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="font-display text-xl font-normal text-fg">Could this apply to you?</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Build your profile and we'll check this scheme, and others, against your details.
                </p>
                <Link to="/onboarding" className={buttonVariants({ variant: "outline", className: "mt-5 w-full" })}>
                  Check my eligibility
                  <ArrowRight />
                </Link>
              </GlassCard>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-normal text-fg">{title}</h2>
      <div className="mt-4 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  )
}
