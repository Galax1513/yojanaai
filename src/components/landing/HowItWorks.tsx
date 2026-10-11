import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight, Check, HelpCircle, MapPin, GraduationCap, Wallet } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { SectionHeading } from "@/components/common/SectionHeading"
import { GlassCard } from "@/components/common/GlassCard"
import { ProgressRing } from "@/components/common/ProgressRing"
import { StatusBadge } from "@/components/common/StatusBadge"

const steps = [
  { n: "01", title: "Tell us about yourself", desc: "A short profile: location, education, household." },
  { n: "02", title: "We check the requirements", desc: "Your answers are compared with each scheme's structured rules." },
  { n: "03", title: "See what may apply", desc: "Potential matches, what's still unknown, and where to apply." },
]

// Illustration only — clearly labelled as an example in the UI.
const previewFields = [
  { icon: MapPin, label: "Location", value: "Tamil Nadu", done: true },
  { icon: GraduationCap, label: "Education", value: "B.Tech · 3rd year", done: true },
  { icon: Wallet, label: "Household", value: "Not added yet", done: false },
]

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          kicker="How it works"
          title="One profile. A clearer path."
          description="Answer a few questions once. We compare them with each scheme's rules and show what may apply to you, and why."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          <motion.div {...reveal} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="lg:col-span-5 lg:row-span-2">
            <GlassCard className="flex h-full flex-col p-7 sm:p-9">
              <p className="label-micro">Three steps</p>
              <ol className="mt-6 flex-1 divide-y divide-line">
                {steps.map((step) => (
                  <li key={step.n} className="flex gap-5 py-6 first:pt-2 last:pb-0">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong font-display text-base font-medium text-fg">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-xl font-normal text-fg">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/onboarding" className={buttonVariants({ variant: "primary", className: "mt-8 w-full sm:w-fit" })}>
                Start your profile
                <ArrowRight />
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div {...reveal} transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="lg:col-span-7">
            <GlassCard className="h-full p-7 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="label-micro">Example profile</p>
                  <h3 className="mt-3 text-2xl font-normal text-fg sm:text-3xl">Build it once</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                    Add details at your own pace. Every answer narrows the list.
                  </p>
                </div>
                <ProgressRing value={66} label="2/3" sublabel="Done" />
              </div>
              <dl className="mt-8 grid gap-3 sm:grid-cols-3">
                {previewFields.map(({ icon: Icon, label, value, done }) => (
                  <div key={label} className="rounded-2xl bg-fg/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-full bg-surface/70 dark:bg-white/[0.06]">
                        <Icon className="size-4 text-accent-ink" strokeWidth={1.75} />
                      </span>
                      {done && <Check className="size-4 text-sage-ink" strokeWidth={2.25} />}
                    </div>
                    <dt className="label-micro mt-4">{label}</dt>
                    <dd className={done ? "mt-1 text-[15px] text-fg" : "mt-1 text-[15px] text-subtle"}>{value}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>
          </motion.div>

          <motion.div {...reveal} transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }} className="lg:col-span-7">
            <GlassCard className="h-full p-7 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="label-micro">Example result</p>
                <StatusBadge tone="potential">More information needed</StatusBadge>
              </div>
              <h3 className="mt-3 text-2xl font-normal text-fg sm:text-3xl">Every match explains itself</h3>
              <ul className="mt-6 space-y-3 text-[15px]">
                <li className="flex items-center gap-3 text-fg">
                  <span className="flex size-7 items-center justify-center rounded-full bg-sage/15">
                    <Check className="size-3.5 text-sage-ink" strokeWidth={2.5} />
                  </span>
                  Age is within the scheme's range
                </li>
                <li className="flex items-center gap-3 text-fg">
                  <span className="flex size-7 items-center justify-center rounded-full bg-sage/15">
                    <Check className="size-3.5 text-sage-ink" strokeWidth={2.5} />
                  </span>
                  Lives in an eligible state
                </li>
                <li className="flex items-center gap-3 text-clay-ink">
                  <span className="flex size-7 items-center justify-center rounded-full bg-clay/20">
                    <HelpCircle className="size-3.5" strokeWidth={2.25} />
                  </span>
                  Annual family income not provided yet
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
