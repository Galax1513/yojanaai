/**
 * Core data model for YojanaAI.
 *
 * These types describe the shape of data the FastAPI backend will
 * eventually serve. Nothing in this file (or anywhere in src/data,
 * src/services) should contain eligibility logic — that lives entirely
 * in the backend rules engine. The frontend only ever renders results
 * it is given.
 */

export type SchemeCategory =
  | "education"
  | "women"
  | "employment"
  | "healthcare"
  | "housing"
  | "agriculture"
  | "disability"
  | "family-social-security"

export type SchemeType =
  | "scholarship"
  | "subsidy"
  | "certification"
  | "pension"
  | "insurance"
  | "grant"

export type MatchStatus = "eligible" | "potential" | "not-eligible"

export type DocumentStatus = "ready" | "missing" | "needs-verification"

export type DeadlineUrgency = "closing-soon" | "open" | "upcoming"

export interface RequiredDocument {
  id: string
  name: string
  reason: string
  status: DocumentStatus
}

export interface Deadline {
  id: string
  schemeId: string
  schemeName: string
  urgency: DeadlineUrgency
  label: string
  date?: string
}

export interface EligibilityCriterion {
  id: string
  label: string
  satisfied: boolean
}

export interface Scheme {
  id: string
  name: string
  category: SchemeCategory
  schemeType: SchemeType
  state: string | "All India"
  summary: string
  benefit: string
  eligibilitySummary: string
  whoCanApply: string
  applicationProcess: string[]
  officialSourceUrl: string
  officialSourceLabel: string
  lastVerified: string
  requiredDocuments: RequiredDocument[]
  deadline?: Deadline
  /** Optional filtering metadata — used by Discover's filters. */
  educationLevels?: string[]
  maxAnnualIncome?: number
}

export interface SchemeMatch {
  scheme: Scheme
  status: MatchStatus
  matchReason: EligibilityCriterion[]
  needsVerification: EligibilityCriterion[]
}

export interface UserProfile {
  name?: string
  age?: number
  state?: string
  district?: string
  areaType?: string
  gender?: string
  educationLevel?: string
  course?: string
  yearOfStudy?: string
  institutionType?: string
  annualFamilyIncome?: number
  employmentStatus?: string
  category?: string
  disabilityStatus?: boolean
  profileCompleteness: number
}
