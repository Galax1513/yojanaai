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
      <div className="min-h-screen pb-28 pt-36 sm:pt-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wide text-terracotta">{kicker}</p>
            <h1 className="mt-3 font-display text-4xl text-sand sm:text-5xl">{title}</h1>
            <p className="mt-4 text-sm text-mist">Last updated: {lastUpdated}</p>
            <div className="mt-6 text-base leading-7 text-mist">{intro}</div>
          </header>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <GlassCard key={item.title} className="p-5">
                <p className="text-sm font-medium text-sand">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-mist">{item.body}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-16 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-16">
            <article className="max-w-3xl">
              {sections.map((section, i) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={cn("scroll-mt-28 border-t border-canvas-line py-10", i === 0 && "border-t-0 pt-0")}
                >
                  <h2 className="flex items-baseline gap-3 font-display text-2xl text-sand">
                    <span className="text-base text-terracotta">{String(i + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-mist">{section.content}</div>
                </section>
              ))}
            </article>

            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-medium uppercase tracking-wide text-mist">On this page</p>
                <ol className="mt-4 space-y-2.5 border-l border-canvas-line">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="-ml-px block border-l border-transparent pl-4 text-sm text-mist transition-colors hover:border-terracotta hover:text-sand"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
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
    <ul className="list-disc space-y-2 pl-5 marker:text-terracotta/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
