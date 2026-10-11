import { motion } from "framer-motion"
import { User, Search, ShieldCheck, FileCheck2, ExternalLink, ArrowDown, ArrowRight } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { SectionHeading } from "@/components/common/SectionHeading"
import { GlassCard } from "@/components/common/GlassCard"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "react-router-dom"

const stages = [
  {
    n: "01",
    icon: User,
    title: "Build your profile",
    desc: "A short, progressive set of questions — location, education, household, and the factors that matter for eligibility. Nothing irrelevant is asked.",
  },
  {
    n: "02",
    icon: Search,
    title: "Browse or discover schemes",
    desc: "Explore the full catalog by category any time, with or without a profile — or let your profile narrow it down automatically.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Eligibility is evaluated",
    desc: "Your profile is checked against structured scheme rules — not keyword matching or guesswork.",
  },
  {
    n: "04",
    icon: FileCheck2,
    title: "Understand what you need",
    desc: "See exactly which requirements you satisfy, what still needs verification, and what documents to prepare.",
  },
  {
    n: "05",
    icon: ExternalLink,
    title: "Apply through the official source",
    desc: "YojanaAI always points you to the real government portal — you apply directly with them, every time.",
  },
]

const flow = ["Profile information", "Eligibility requirements", "Matched schemes", "Documents", "Official application"]

export function HowItWorksPage() {
  return (
    <PageTransition>
      <div className="min-h-screen px-3 pb-16 pt-32 sm:px-5 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            as="h1"
            kicker="How it works"
            title="From a short profile to a clear next step."
            description="No guesswork, no keyword matching — your details are checked against structured scheme rules."
          />

          <ol className="relative mt-16 space-y-4 before:absolute before:bottom-10 before:left-[3rem] before:top-10 before:w-px before:bg-line-strong sm:before:left-[3.75rem]">
            {stages.map((stage, i) => {
              const Icon = stage.icon
              return (
                <motion.li
                  key={stage.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GlassCard className="relative flex gap-5 p-5 sm:gap-8 sm:p-7">
                    <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary sm:size-16">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="max-w-2xl pt-1">
                      <p className="label-micro">Step {stage.n}</p>
                      <h2 className="mt-1.5 text-2xl font-normal text-fg">{stage.title}</h2>
                      <p className="mt-2 text-[15px] leading-relaxed text-muted">{stage.desc}</p>
                    </div>
                  </GlassCard>
                </motion.li>
              )
            })}
          </ol>

          <div className="mt-24">
            <SectionHeading kicker="The flow" title="What travels through the system." />
            <GlassCard className="mt-10 p-6 sm:p-10">
              <ol className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
                {flow.map((step, i) => (
                  <li key={step} className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
                    <span className="flex items-center gap-3 rounded-full border border-line bg-field py-2 pl-2 pr-5 text-sm text-fg">
                      <span className="flex size-7 items-center justify-center rounded-full bg-fg/[0.07] font-display text-xs font-medium">
                        {i + 1}
                      </span>
                      {step}
                    </span>
                    {i < flow.length - 1 && (
                      <>
                        <ArrowDown className="ml-5 size-4 text-subtle lg:hidden" />
                        <ArrowRight className="hidden size-4 text-subtle lg:block" />
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </GlassCard>
          </div>

          <GlassCard className="mt-16 flex flex-col items-start justify-between gap-6 p-7 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-3xl font-light text-fg">Ready when you are.</h2>
              <p className="mt-2 text-sm text-muted">Start a profile, or browse the full catalog first.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/onboarding" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Find My Benefits
              </Link>
              <Link to="/discover" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Explore schemes
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
