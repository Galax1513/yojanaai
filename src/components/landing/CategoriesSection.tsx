import { SectionHeading } from "@/components/common/SectionHeading"
import { CategoryCard } from "@/components/scheme/CategoryCard"
import { categories } from "@/data/categories"

export function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-24 px-3 pb-24 sm:px-5 sm:pb-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          kicker="Browse by category"
          title="Support across every stage of life."
          description="Start from what you need. Each category opens the catalog already filtered."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}
