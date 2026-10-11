import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { ArrowRight, ArrowUpRight, Briefcase, GraduationCap, HeartPulse, Home, Search, Shield, Sprout, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import heroImage from "@/assets/images/hero-village-street.webp"
import heroImageMobile from "@/assets/images/hero-village-street-mobile.webp"

const ease = [0.22, 1, 0.36, 1] as const

// Floating category pills — each one is a real catalog filter.
const floatingChips = [
  { label: "Scholarships", category: "education", icon: GraduationCap, className: "right-[30%] top-[22%] -rotate-[5deg]" },
  { label: "Farmers", category: "agriculture", icon: Sprout, className: "right-[7%] top-[16%] rotate-[4deg]" },
  { label: "Health", category: "healthcare", icon: HeartPulse, className: "right-[19%] top-[37%] rotate-[2deg]" },
  { label: "Housing", category: "housing", icon: Home, className: "right-[4%] top-[50%] -rotate-[4deg]" },
  { label: "Women", category: "women", icon: Users, className: "right-[33%] top-[50%] rotate-[5deg]" },
  { label: "Jobs & skills", category: "employment", icon: Briefcase, className: "right-[15%] top-[63%] -rotate-[2deg]" },
  { label: "Pensions", category: "family-social-security", icon: Shield, className: "right-[36%] top-[66%] -rotate-[3deg]" },
]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })

  // Subtle parallax only — a small, restrained shift.
  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/discover?search=${encodeURIComponent(q)}` : "/discover")
  }

  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        ref={ref}
        className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[96rem] flex-col overflow-hidden rounded-[2rem] bg-night sm:min-h-[min(calc(100svh-2rem),58rem)] sm:rounded-[2.5rem]"
      >
        <motion.div style={{ y: imageY }} className="absolute inset-0">
          <picture>
            <source media="(max-width: 640px)" srcSet={heroImageMobile} />
            <img
              src={heroImage}
              alt="A quiet small-town street in India at sunset, with fields, distant hills, and a temple silhouette."
              className="h-[112%] w-full object-cover object-center saturate-[0.78]"
              fetchPriority="high"
            />
          </picture>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/30 to-night/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-night/70 via-night/15 to-transparent" />

        {/* Floating category pills (large screens) */}
        <div className="absolute inset-0 hidden lg:block">
          {floatingChips.map((chip, i) => {
            const Icon = chip.icon
            return (
              <motion.div
                key={chip.label}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 + i * 0.07, ease }}
                className={`absolute ${chip.className}`}
              >
                <Link
                  to={`/discover?category=${chip.category}`}
                  className="glass-photo group flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-5 text-[15px] font-medium transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  {chip.label}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-6 pt-32 sm:px-10 sm:pb-10">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="glass-photo mb-6 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            Independent scheme discovery
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="max-w-3xl text-balance text-[2.9rem] font-light leading-[0.98] text-cream sm:text-7xl lg:text-[5.4rem]"
          >
            Find the support you may be eligible for.
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mt-6 max-w-lg text-balance text-base leading-relaxed text-cream/80 sm:text-lg"
          >
            Browse thousands of central and state schemes, or build one profile and see potential
            matches, each with the reasons behind it.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/onboarding" className={buttonVariants({ variant: "accent", size: "lg" })}>
              Find My Benefits
              <ArrowRight />
            </Link>
            <Link to="/discover" className={buttonVariants({ variant: "photo", size: "lg" })}>
              Explore schemes
            </Link>
          </motion.div>

          <motion.form
            onSubmit={onSearch}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease }}
            role="search"
            className="glass-photo mt-10 flex w-full max-w-xl items-center gap-3 rounded-[1.75rem] p-2 pl-5 sm:mt-14"
          >
            <Search className="size-5 shrink-0 text-cream/70" strokeWidth={1.75} />
            <label className="min-w-0 flex-1">
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-cream/60">
                Looking for
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. post-matric scholarship"
                className="w-full bg-transparent text-[15px] text-cream placeholder:text-cream/45 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              aria-label="Search schemes"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-[#1c190f] transition-colors hover:bg-[#d6c9a2]"
            >
              <ArrowUpRight className="size-5" />
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
