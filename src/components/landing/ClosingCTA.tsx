import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "react-router-dom"
import closingImage from "@/assets/images/closing-market-street.webp"
import closingImageMobile from "@/assets/images/closing-market-street-mobile.webp"

export function ClosingCTA() {
  return (
    <section className="px-3 sm:px-5">
      <div className="relative mx-auto max-w-[96rem] overflow-hidden rounded-[2rem] bg-night sm:rounded-[2.5rem]">
        <picture>
          <source media="(max-width: 640px)" srcSet={closingImageMobile} />
          <img
            src={closingImage}
            alt="A quiet neighbourhood street in an Indian town, with local shops and homes under warm light."
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[0.78]"
            loading="lazy"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/25 to-night/30" />

        <div className="relative flex min-h-[32rem] items-center justify-center px-5 py-20 sm:min-h-[36rem]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-photo flex max-w-lg flex-col items-center rounded-[2rem] px-7 py-10 text-center sm:px-12 sm:py-12"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cream/70">Takes a few minutes</p>
            <h2 className="mt-4 text-balance text-4xl font-light leading-[1.05] text-cream sm:text-5xl">
              Know what's available to you.
            </h2>
            <p className="mt-4 max-w-sm text-balance text-[15px] leading-relaxed text-cream/80">
              One profile. A clearer path to the benefits you may be eligible for.
            </p>
            <Link to="/onboarding" className={buttonVariants({ variant: "accent", size: "lg", className: "mt-8" })}>
              Find My Benefits
              <ArrowRight />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
