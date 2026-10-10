/**
 * These types mirror the backend's Pydantic schemas exactly
 * (backend/app/schemas/scheme.py) — snake_case, matching the real API
 * response shape. Distinct from the older src/types/scheme.ts mock
 * shape, which ResultsPage still uses until the eligibility engine
 * (a later phase) replaces it too.
 */

export type ApiSchemeCategory =
  | "education"
  | "women"
  | "employment"
  | "healthcare"
  | "housing"
  | "agriculture"
  | "disability"
  | "family-social-security"

export type ApiSchemeType = "scholarship" | "subsidy" | "certification" | "pension" | "insurance" | "grant"
export type ApiSchemeLevel = "central" | "state"
export type ApiSchemeStatus = "active" | "inactive" | "deprecated"
export type ApiDataStatus = "development" | "verified"
export type ApiDeadlineUrgency = "closing-soon" | "open" | "upcoming"

export interface ApiRequiredDocument {
  id: number
  name: string
  reason: string
}

export interface ApiDataSource {
  provider_name: string
  dataset_name: string
  license: string | null
  source_url: string | null
  is_official_government_source: boolean
}

export interface ApiSchemeListItem {
  id: string
  slug: string
  name: string
  short_title: string | null
  level: ApiSchemeLevel | null
  ministry: string | null
  state: string | null
  category: ApiSchemeCategory
  scheme_type: ApiSchemeType
  summary: string
  benefit: string
  eligibility_summary: string
  deadline_label: string | null
  deadline_urgency: ApiDeadlineUrgency | null
  status: ApiSchemeStatus
  data_status: ApiDataStatus
}

export interface ApiSchemeDetail {
  id: string
  source_id: string | null
  slug: string
  name: string
  short_title: string | null

  level: ApiSchemeLevel | null
  ministry: string | null
  department: string | null
  state: string | null

  category: ApiSchemeCategory
  categories: string[] | null
  tags: string[] | null
  scheme_type: ApiSchemeType

  summary: string
  description: string | null
  benefit: string
  benefits: string | null
  eligibility_summary: string
  who_can_apply: string

  documents_required_raw: string | null
  application_process: string[]
  required_documents: ApiRequiredDocument[]

  official_source_url: string | null
  official_source_label: string | null
  official_application_url: string | null

  source_updated_at: string | null
  last_synced_at: string | null
  last_verified_at: string | null

  status: ApiSchemeStatus
  data_status: ApiDataStatus

  education_levels: string[] | null
  max_annual_income: number | null

  deadline_label: string | null
  deadline_date: string | null
  deadline_urgency: ApiDeadlineUrgency | null

  data_source: ApiDataSource | null

  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Support categories — mirrors backend/app/schemas/support.py. A
// controlled taxonomy for narrowing lists by the kind of support a
// scheme offers; it never affects eligibility. See
// backend/app/services/support_taxonomy.py for which scheme fields each
// category and subcategory maps to.
// ---------------------------------------------------------------------------

export interface ApiSupportSubcategory {
  key: string
  label: string
}

export interface ApiSupportCategory {
  key: string
  label: string
  description: string
  subcategories: ApiSupportSubcategory[]
}

export interface ApiSupportFacet {
  category: string
  count: number
  subcategories: { subcategory: string; count: number }[]
}

export interface ApiSchemeListResponse {
  items: ApiSchemeListItem[]
  /** Count after every filter, including the support filter. */
  total: number
  limit: number
  offset: number
  /** Count after every filter except the support filter ("All support"). */
  unfiltered_total: number
  /** Per-category counts over that unfiltered set. */
  support_facets: ApiSupportFacet[]
}

export interface SchemeListParams {
  category?: string
  state?: string
  scheme_type?: string
  education_level?: string
  level?: string
  ministry?: string
  income?: number
  search?: string
  support_category?: string
  support_subcategory?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Profile (Phase 2A) — mirrors backend/app/schemas/profile.py exactly.
// ---------------------------------------------------------------------------

export type ApiAreaType = "Urban" | "Rural"
export type ApiGender = "Female" | "Male" | "Other" | "Prefer not to say"
export type ApiEducationLevel =
  | "Below Class 10"
  | "Class 10"
  | "Class 12"
  | "Undergraduate"
  | "Postgraduate"
  | "Diploma"
  | "Doctorate"
  | "Other"
export type ApiYearOfStudy = "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "5th Year" | "Final Year"
export type ApiInstitutionType = "Government" | "Private" | "Aided" | "Other"
export type ApiEmploymentStatus = "Student" | "Farmer" | "Employed" | "Unemployed" | "Other"
export type ApiSocialCategory = "General" | "OBC" | "SC" | "ST" | "EWS" | "Other" | "Prefer not to say"
export type ApiBplStatus = "Yes" | "No" | "Unknown"
export type ApiDisabilityStatus = "Yes" | "No" | "Unknown"

/** The editable profile fields — same shape for create (POST) and
 * update (PUT) payloads, matching backend/app/schemas/profile.py's
 * ProfileBase. Every field is optional: the profile is built up
 * progressively and only ever POSTed once, in full, at the end of
 * onboarding in this phase. */
export interface ProfileInput {
  name?: string | null
  age?: number | null
  state?: string | null
  district?: string | null
  area_type?: ApiAreaType | null
  gender?: ApiGender | null
  education_level?: ApiEducationLevel | null
  course?: string | null
  year_of_study?: ApiYearOfStudy | null
  institution_type?: ApiInstitutionType | null
  annual_family_income?: number | null
  employment_status?: ApiEmploymentStatus | null
  occupation?: string | null
  social_category?: ApiSocialCategory | null
  bpl_status?: ApiBplStatus | null
  disability_status?: ApiDisabilityStatus | null
}

export interface ApiProfile extends ProfileInput {
  id: string
  created_at: string
  updated_at: string
}

/** The response shape for every profile endpoint — profile_completeness
 * is always server-calculated, never invented on the frontend. */
export interface ApiProfileWithCompleteness {
  profile: ApiProfile
  profile_completeness: number
}

// ---------------------------------------------------------------------------
// Eligibility (Phase 2B/2C) — mirrors backend/app/schemas/eligibility.py
// exactly. Deterministic rule evaluation only — no confidence score, no
// probability, nothing invented on the frontend. React only renders what
// the backend evaluated; it never computes eligibility itself.
// ---------------------------------------------------------------------------

export type EligibilityEvaluationResult = "matched" | "needs_information" | "not_matched"
export type EligibilityOverallStatus = "MATCH" | "NEEDS_INFORMATION" | "NOT_MATCHED"

/** One structured rule, evaluated against one profile — always
 * traceable back to its source row via eligibility_rule_id. */
export interface EligibilityRuleEvaluation {
  eligibility_rule_id: number
  field: string
  operator: string
  normalized_value: unknown
  profile_value_used: unknown
  result: EligibilityEvaluationResult
  reason: string
}

/** The result for one scheme against one profile. status is derived
 * purely from structured rule evaluation; requires_source_review is a
 * separate signal (the scheme also has free-text eligibility
 * information worth reading) that never overrides a deterministic
 * MATCH. This is a "potential match" signal, never an official
 * eligibility determination. */
export interface EligibilityResult {
  scheme_id: string
  scheme_slug: string
  scheme_name: string
  status: EligibilityOverallStatus
  requires_source_review: boolean
  evaluations: EligibilityRuleEvaluation[]
  scheme: ApiSchemeListItem
}

export interface PaginatedEligibilityResults {
  items: EligibilityResult[]
  /** Potential matches after the support filter, if any. */
  total: number
  limit: number
  offset: number
  /** Potential matches before the support filter ("All support"). */
  unfiltered_total: number
  /** Per-category counts over those unfiltered potential matches. */
  support_facets: ApiSupportFacet[]
}

/** Optional narrowing by the kind of support a scheme offers — applied
 * by the backend only after eligibility has been evaluated. */
export interface SupportFilterParams {
  support_category?: string
  support_subcategory?: string
}

// ---------------------------------------------------------------------------
// Auth — mirrors backend/app/schemas/auth.py exactly.
// ---------------------------------------------------------------------------

export interface AuthCredentials {
  email: string
  password: string
}

export interface ApiUser {
  id: string
  email: string
  /** null until the person has completed onboarding once. */
  profile_id: string | null
}

export interface ApiAuthResponse {
  access_token: string
  token_type: "bearer"
  user: ApiUser
}
