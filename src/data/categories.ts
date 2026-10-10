import {
  GraduationCap,
  Users,
  Briefcase,
  HeartPulse,
  Home,
  Sprout,
  Accessibility,
  Shield,
  type LucideIcon,
} from "lucide-react"
import type { SchemeCategory } from "@/types/scheme"

export interface CategoryConfig {
  id: SchemeCategory
  name: string
  icon: LucideIcon
  description: string
  route: string
}

export const categories: CategoryConfig[] = [
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    description: "Scholarships and support for students",
    route: "/discover?category=education",
  },
  {
    id: "women",
    name: "Women",
    icon: Users,
    description: "Programs for women's welfare and empowerment",
    route: "/discover?category=women",
  },
  {
    id: "employment",
    name: "Employment",
    icon: Briefcase,
    description: "Skilling, training, and job support",
    route: "/discover?category=employment",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: HeartPulse,
    description: "Medical assistance and insurance schemes",
    route: "/discover?category=healthcare",
  },
  {
    id: "housing",
    name: "Housing",
    icon: Home,
    description: "Home ownership and construction support",
    route: "/discover?category=housing",
  },
  {
    id: "agriculture",
    name: "Agriculture",
    icon: Sprout,
    description: "Support for farmers and rural livelihoods",
    route: "/discover?category=agriculture",
  },
  {
    id: "disability",
    name: "Disability",
    icon: Accessibility,
    description: "Assistance for persons with disabilities",
    route: "/discover?category=disability",
  },
  {
    id: "family-social-security",
    name: "Family & Social Security",
    icon: Shield,
    description: "Pensions, welfare, and family support",
    route: "/discover?category=family-social-security",
  },
]

/** Display name for a category id, e.g. "family-social-security" -> "Family & Social Security". */
export function getCategoryLabel(id: string): string {
  return categories.find((c) => c.id === id)?.name ?? id
}
