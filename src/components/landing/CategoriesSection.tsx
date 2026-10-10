import { SectionHeading } from "@/components/common/SectionHeading"
import { CategoryCard } from "@/components/scheme/CategoryCard"
import { categories } from "@/data/categories"

export function CategoriesSection() {
  return (
    <section id="categories" className="bg-canvas py-28 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker="Browse by life stage" title="Support across every stage of life." tone="dark" />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}
