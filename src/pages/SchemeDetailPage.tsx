import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, ExternalLink, Search, AlertTriangle, Loader2 } from "lucide-react"
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
          <Loader2 className="size-5 animate-spin text-mist" />
        </div>
      </PageTransition>
    )
  }

  if (error === "not-found" || !scheme) {
    return (
      <PageTransition>
        <div className="min-h-screen pb-28 pt-40">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <EmptyState
              icon={Search}
              title="Scheme not found"
              description="This scheme may have been removed or the link is incorrect."
              actionLabel="Back to Discover"
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error === "error") {
    return (
      <PageTransition>
        <div className="min-h-screen pb-28 pt-40">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
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

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 pt-36 sm:pt-40">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Link to="/discover" className="inline-flex items-center gap-1.5 text-sm text-mist transition-colors hover:text-sand">
            <ArrowLeft className="size-3.5" />
            Back to Discover
          </Link>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="neutral" withIcon={false}>
                {getCategoryLabel(scheme.category)}
              </StatusBadge>
              {scheme.state ? (
                <StatusBadge tone="neutral" withIcon={false}>{scheme.state}</StatusBadge>
              ) : scheme.level === "central" ? (
                <StatusBadge tone="neutral" withIcon={false}>All India</StatusBadge>
              ) : null}
            </div>
            <h1 className="mt-3 max-w-xl font-display text-3xl text-sand sm:text-4xl">{scheme.name}</h1>
            {scheme.benefit && <p className="mt-3 text-lg text-terracotta-soft">{scheme.benefit}</p>}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-10">
              <section>
                <h2 className="font-display text-xl text-sand">Overview</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">
                  {scheme.description || scheme.summary}
                </p>
              </section>

              {scheme.benefits && (
                <section>
                  <h2 className="font-display text-xl text-sand">Benefits</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-sand">{scheme.benefits}</p>
                </section>
              )}

              <section>
                <h2 className="font-display text-xl text-sand">Who can apply</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">{scheme.who_can_apply}</p>
              </section>

              <section>
                <h2 className="font-display text-xl text-sand">Eligibility requirements</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">
                  {scheme.eligibility_summary}
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-sand">
                  Documents you may need when applying
                </h2>
                <p className="mt-1 text-xs text-mist">
                  These are listed for your information — you don't upload anything to YojanaAI.
                  They may be required when you apply through the official government portal.
                </p>
                {scheme.required_documents.length > 0 ? (
                  <GlassCard className="mt-4 p-5">
                    {scheme.required_documents.map((doc) => (
                      <DocumentStatusRow key={doc.id} document={doc} />
                    ))}
                  </GlassCard>
                ) : scheme.documents_required_raw ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">
                    {scheme.documents_required_raw}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-mist">No document list available from the source.</p>
                )}
              </section>

              {scheme.application_process.length > 0 && (
                <section>
                  <h2 className="font-display text-xl text-sand">Application process</h2>
                  <ol className="mt-4 space-y-3">
                    {scheme.application_process.map((step, i) => (
                      <li key={step} className="flex gap-3 text-sm text-mist">
                        <span className="font-display text-terracotta">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <GlassCard className="border-terracotta/25 bg-terracotta/[0.06] p-5">
                <p className="font-display text-base text-sand">Want to know if YOU qualify?</p>
                <p className="mt-2 text-xs leading-relaxed text-mist">
                  Build your profile and we'll check this scheme — and others — against your details.
                </p>
                <Link
                  to="/onboarding"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-soft transition-colors hover:text-sand"
                >
                  Check my eligibility
                  <ArrowRight className="size-3.5" />
                </Link>
              </GlassCard>

              <GlassCard className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-mist">Official source</p>
                <p className="mt-3 text-sm text-sand">
                  {scheme.official_source_label ?? scheme.ministry ?? "Not specified by the source"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-mist">
                  {scheme.data_status === "verified" && scheme.last_verified_at
                    ? `Last verified ${new Date(scheme.last_verified_at).toLocaleDateString("en-IN")}`
                    : "This record hasn't been independently verified against the official source yet."}
                </p>
              </GlassCard>

              {/* Never invented — only rendered when the database actually
                  has the URL. Official application URL takes priority;
                  falls back to the general source page. */}
              {scheme.official_application_url ? (
                <a
                  href={scheme.official_application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "accent" }) + " w-full"}
                >
                  Apply on Official Website
                  <ExternalLink className="size-4" />
                </a>
              ) : scheme.official_source_url ? (
                <a
                  href={scheme.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "accent" }) + " w-full"}
                >
                  View Official Scheme Details
                  <ExternalLink className="size-4" />
                </a>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  No official link on file
                </Button>
              )}
              <p className="text-center text-[11px] leading-relaxed text-mist">
                You'll leave YojanaAI and apply directly on the official government portal.
                YojanaAI doesn't process applications or collect application documents.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
