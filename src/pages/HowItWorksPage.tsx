import { motion } from "framer-motion"
import { User, Search, ShieldCheck, FileCheck2, ExternalLink, ArrowDown } from "lucide-react"
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
      <div className="min-h-screen pb-28 pt-36 sm:pt-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            kicker="How it works"
            title="From a short profile to a clear, verifiable next step."
            description="No guesswork, no keyword matching — just your details checked against structured scheme rules."
            tone="dark"
          />

          <div className="mt-16 space-y-10">
            {stages.map((stage, i) => {
              const Icon = stage.icon
              return (
                <motion.div
                  key={stage.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-6 border-t border-canvas-line pt-10 sm:flex-row sm:items-start"
                >
                  <div className="flex items-center gap-4 sm:w-48 sm:shrink-0">
                    <span className="font-display text-2xl text-terracotta">{stage.n}</span>
                    <div className="flex size-10 items-center justify-center rounded-md border border-canvas-line bg-canvas-raised">
                      <Icon className="size-4 text-terracotta-soft" />
                    </div>
                  </div>
                  <div className="max-w-xl">
                    <h2 className="font-display text-2xl text-sand">{stage.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{stage.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-20 border-t border-canvas-line pt-16">
            <SectionHeading kicker="The flow" title="What travels through the system." tone="dark" />
            <GlassCard className="mt-8 flex flex-col items-start gap-2 p-8 sm:items-center">
              {flow.map((step, i) => (
                <div key={step} className="flex flex-col items-start gap-2 sm:items-center">
                  <span className="rounded-md border border-canvas-line bg-canvas px-4 py-2 text-sm text-sand">
                    {step}
                  </span>
                  {i < flow.length - 1 && <ArrowDown className="size-4 text-mist" />}
                </div>
              ))}
            </GlassCard>
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-3 border-t border-canvas-line pt-12">
            <Link to="/onboarding" className={buttonVariants({ variant: "accent", size: "lg" })}>
              Find My Benefits
            </Link>
            <Link to="/discover" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Explore Schemes
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
