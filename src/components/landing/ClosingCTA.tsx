import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "react-router-dom"
import closingImage from "@/assets/images/closing-market-street.webp"
import closingImageMobile from "@/assets/images/closing-market-street-mobile.webp"

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <picture>
        <source media="(max-width: 640px)" srcSet={closingImageMobile} />
        <img
          src={closingImage}
          alt="A quiet neighbourhood street in an Indian town, with local shops and homes under warm light."
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
      </picture>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 85% at 50% 50%, rgba(21,19,15,0.65), rgba(21,19,15,0) 70%), linear-gradient(to bottom, rgba(21,19,15,0.45), rgba(21,19,15,0) 30%, rgba(21,19,15,0.55))",
        }}
      />

      <div className="relative mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-balance font-display text-3xl font-normal leading-tight text-sand drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-4xl"
        >
          Know what's available to you.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-sm text-balance text-base leading-relaxed text-sand/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        >
          One profile. A clearer path to the benefits that may be available.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <Link to="/onboarding" className={buttonVariants({ variant: "accent", size: "lg" })}>
            Find My Benefits
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
