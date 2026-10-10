import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import heroImage from "@/assets/images/hero-village-street.webp"
import heroImageMobile from "@/assets/images/hero-village-street-mobile.webp"

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // Subtle parallax only — a small, restrained shift, not aggressive zoom/scroll hijacking.
  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 48])

  return (
    <section ref={ref} className="relative h-[92svh] min-h-[560px] overflow-hidden bg-canvas">
      <motion.div style={{ y: imageY }} className="absolute inset-0">
        <picture>
          <source media="(max-width: 640px)" srcSet={heroImageMobile} />
          <img
            src={heroImage}
            alt="A quiet small-town street in India at sunset, with fields, distant hills, and a temple silhouette."
            className="h-[112%] w-full object-cover object-center"
            fetchPriority="high"
          />
        </picture>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/35 to-canvas/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas/75 via-canvas/20 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 text-sm font-medium tracking-wide text-terracotta-soft"
        >
          Government benefits, personalized
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-balance font-display text-5xl font-normal leading-[1.08] text-sand sm:text-6xl md:text-7xl"
        >
          Benefits you qualify for, without the paperwork maze.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-md text-balance text-lg leading-relaxed text-mist"
        >
          Millions of people may qualify for support they never discover. YojanaAI helps you
          find it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link to="/onboarding" className={buttonVariants({ variant: "accent", size: "lg" })}>
            Find My Benefits
            <ArrowRight />
          </Link>
          <Link to="/discover" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Explore Schemes
            <ArrowRight />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
