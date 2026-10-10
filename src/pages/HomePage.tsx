import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { CategoriesSection } from "@/components/landing/CategoriesSection"
import { ClosingCTA } from "@/components/landing/ClosingCTA"

export function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CategoriesSection />
      <ClosingCTA />
    </>
  )
}
