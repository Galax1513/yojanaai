import { PageTransition } from "@/components/common/PageTransition"
import { GlassCard } from "@/components/common/GlassCard"
import { cn } from "@/lib/utils"

export interface LegalSection {
  id: string
  title: string
  content: React.ReactNode
}

interface LegalPageProps {
  kicker: string
  title: string
  lastUpdated: string
  intro: React.ReactNode
  /** The few points a reader most needs, shown above the full text. */
  summary: { title: string; body: string }[]
  sections: LegalSection[]
}

/** Shared layout for Privacy Policy and Terms of Use: readable width,
 * numbered sections, and an "on this page" index on wide screens. */
export function LegalPage({ kicker, title, lastUpdated, intro, summary, sections }: LegalPageProps) {
  return (
    <PageTransition>
      <div className="min-h-screen px-3 pb-16 pt-32 sm:px-5 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-3xl">
            <p className="label-micro text-accent-ink">{kicker}</p>
            <h1 className="mt-4 text-5xl font-light leading-[1.02] text-fg sm:text-6xl">{title}</h1>
            <p className="mt-5 inline-flex rounded-full bg-fg/[0.06] px-3 py-1 text-xs text-muted">
              Last updated {lastUpdated}
            </p>
            <div className="mt-6 text-base leading-7 text-muted">{intro}</div>
          </header>

          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {summary.map((item) => (
              <GlassCard key={item.title} className="p-6">
                <p className="font-display text-lg font-medium text-fg">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-6">
            <GlassCard className="p-7 sm:p-12">
              <article className="max-w-3xl">
                {sections.map((section, i) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className={cn("scroll-mt-28 border-t border-line py-10", i === 0 && "border-t-0 pt-0", i === sections.length - 1 && "pb-0")}
                  >
                    <h2 className="flex items-center gap-4 text-2xl font-normal text-fg">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong font-display text-sm font-medium">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </h2>
                    <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted">{section.content}</div>
                  </section>
                ))}
              </article>
            </GlassCard>

            <nav aria-label="On this page" className="hidden lg:block">
              <GlassCard className="sticky top-24 p-5">
                <p className="label-micro">On this page</p>
                <ol className="mt-4 space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-fg/[0.05] hover:text-fg"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            </nav>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

/** A bulleted list styled for the legal pages. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-accent-strong">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
