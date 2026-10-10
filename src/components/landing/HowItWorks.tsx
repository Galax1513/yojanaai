import { motion } from "framer-motion"
import { MapPin, GraduationCap, Home, Check } from "lucide-react"
import { SectionHeading } from "@/components/common/SectionHeading"
import { GlassCard } from "@/components/common/GlassCard"

const steps = [
  { n: "01", title: "Tell us about yourself", desc: "A short profile — location, education, household." },
  { n: "02", title: "We check the requirements", desc: "Your profile is checked against structured scheme rules." },
  { n: "03", title: "Discover what you can apply for", desc: "See your matches and what's needed to apply." },
]

const previewFields = [
  { icon: MapPin, label: "Location", value: "Tamil Nadu", done: true },
  { icon: GraduationCap, label: "Education", value: "B.Tech, 3rd Year", done: true },
  { icon: Home, label: "Household", value: "₹3,50,000 / year", done: false },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-sand py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <SectionHeading kicker="How it works" title="One profile. A clearer path." tone="light" />

            <div className="mt-10 space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-4"
                >
                  <span className="font-display text-sm text-terracotta">{step.n}</span>
                  <div>
                    <h3 className="font-display text-lg text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard tone="dark" className="mx-auto max-w-sm p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-sand">Build your profile</p>
                <span className="text-xs text-mist">2 of 3</span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-canvas-line">
                <div className="h-full w-2/3 rounded-full bg-terracotta" />
              </div>

              <div className="mt-6 space-y-4">
                {previewFields.map((field) => {
                  const Icon = field.icon
                  return (
                    <div key={field.label} className="flex items-center justify-between border-b border-canvas-line/60 pb-3 last:border-none">
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 text-terracotta-soft" />
                        <div>
                          <p className="text-xs text-mist">{field.label}</p>
                          <p className="text-sm text-sand">{field.value}</p>
                        </div>
                      </div>
                      {field.done && <Check className="size-4 text-moss-soft" />}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 rounded-md bg-terracotta py-2.5 text-center text-sm font-semibold text-sand">
                Continue
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
