import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { ProgressIndicator } from "@/components/common/ProgressIndicator"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/common/GlassCard"
import { EmptyState } from "@/components/common/EmptyState"
import { SearchableCombobox } from "@/components/common/SearchableCombobox"
import { TextField, NumberField, SelectField, ChoiceGroup } from "@/components/common/FormFields"
import { indianStates, getDistrictsForState } from "@/data/statesAndDistricts"
import { createProfile, getProfile, updateProfile } from "@/services/api/profiles"
import { ApiError } from "@/services/api/client"
import { useAuth } from "@/contexts/AuthContext"
import type {
  ApiAreaType,
  ApiBplStatus,
  ApiDisabilityStatus,
  ApiEducationLevel,
  ApiEmploymentStatus,
  ApiGender,
  ApiInstitutionType,
  ApiProfile,
  ApiSocialCategory,
  ApiYearOfStudy,
  ProfileInput,
} from "@/types/api"

const steps = ["About you", "Location", "Education", "Household", "Eligibility factors", "Review"]

const genderOptions: ApiGender[] = ["Female", "Male", "Other", "Prefer not to say"]
const employmentOptions: ApiEmploymentStatus[] = ["Student", "Farmer", "Employed", "Unemployed", "Other"]
const areaTypeOptions: ApiAreaType[] = ["Urban", "Rural"]
const educationLevelOptions: ApiEducationLevel[] = [
  "Below Class 10", "Class 10", "Class 12", "Undergraduate", "Postgraduate", "Diploma", "Doctorate", "Other",
]
const yearOfStudyOptions: ApiYearOfStudy[] = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Final Year"]
const institutionTypeOptions: ApiInstitutionType[] = ["Government", "Private", "Aided", "Other"]
const socialCategoryOptions: ApiSocialCategory[] = ["General", "OBC", "SC", "ST", "EWS", "Other", "Prefer not to say"]
const yesNoUnknown: ApiBplStatus[] = ["Yes", "No", "Unknown"]

interface FormState {
  name: string
  age: number | ""
  gender: ApiGender | ""
  employmentStatus: ApiEmploymentStatus | ""
  state: string | null
  district: string | null
  areaType: ApiAreaType | ""
  educationLevel: ApiEducationLevel | ""
  course: string
  yearOfStudy: ApiYearOfStudy | ""
  institutionType: ApiInstitutionType | ""
  occupation: string
  annualFamilyIncome: number | ""
  socialCategory: ApiSocialCategory | ""
  bplStatus: ApiBplStatus | ""
  disabilityStatus: ApiDisabilityStatus | ""
}

const initialForm: FormState = {
  name: "",
  age: "",
  gender: "",
  employmentStatus: "",
  state: null,
  district: null,
  areaType: "",
  educationLevel: "",
  course: "",
  yearOfStudy: "",
  institutionType: "",
  occupation: "",
  annualFamilyIncome: "",
  socialCategory: "",
  bplStatus: "",
  disabilityStatus: "",
}

/** Maps an existing backend profile (GET /api/profiles/{id}) onto this
 * form's local state, for edit mode. Any field the backend has as null
 * simply stays at its blank default. */
function profileToFormState(p: ApiProfile): FormState {
  return {
    name: p.name ?? "",
    age: p.age ?? "",
    gender: p.gender ?? "",
    employmentStatus: p.employment_status ?? "",
    state: p.state ?? null,
    district: p.district ?? null,
    areaType: p.area_type ?? "",
    educationLevel: p.education_level ?? "",
    course: p.course ?? "",
    yearOfStudy: p.year_of_study ?? "",
    institutionType: p.institution_type ?? "",
    occupation: p.occupation ?? "",
    annualFamilyIncome: p.annual_family_income ?? "",
    socialCategory: p.social_category ?? "",
    bplStatus: p.bpl_status ?? "",
    disabilityStatus: p.disability_status ?? "",
  }
}

type Errors = Record<string, string>

function validateStep(step: number, form: FormState): Errors {
  const errors: Errors = {}

  if (step === 0) {
    if (!form.name.trim()) errors.name = "Please enter your name."
    if (form.age === "") errors.age = "Please enter your age."
    else if (form.age < 0 || form.age > 120) errors.age = "Enter a valid age between 0 and 120."
    if (!form.gender) errors.gender = "Please select an option."
    if (!form.employmentStatus) errors.employmentStatus = "Please select an option."
  }

  if (step === 1) {
    if (!form.state) errors.state = "Please select a state."
    if (!form.district) errors.district = "Please select a district."
    if (!form.areaType) errors.areaType = "Please select an option."
  }

  if (step === 2) {
    if (form.employmentStatus === "Student") {
      if (!form.educationLevel) errors.educationLevel = "Please select an education level."
      if (!form.course.trim()) errors.course = "Please enter your course."
      if (!form.yearOfStudy) errors.yearOfStudy = "Please select your year of study."
    } else if (form.employmentStatus === "Employed" || form.employmentStatus === "Farmer" || form.employmentStatus === "Other") {
      if (!form.occupation.trim()) errors.occupation = "Please enter your occupation."
    }
    // Unemployed: nothing further required on this step.
  }

  if (step === 3) {
    if (form.annualFamilyIncome !== "" && form.annualFamilyIncome < 0) {
      errors.annualFamilyIncome = "Income cannot be negative."
    }
  }

  // Step 4 (eligibility factors) is entirely optional — "Unknown" is a
  // legitimate answer, and a person may prefer not to answer at all.

  return errors
}

function buildPayload(form: FormState): ProfileInput {
  return {
    name: form.name.trim() || undefined,
    age: form.age === "" ? undefined : form.age,
    gender: form.gender || undefined,
    employment_status: form.employmentStatus || undefined,
    state: form.state ?? undefined,
    district: form.district ?? undefined,
    area_type: form.areaType || undefined,
    education_level: form.employmentStatus === "Student" ? form.educationLevel || undefined : undefined,
    course: form.employmentStatus === "Student" ? form.course.trim() || undefined : undefined,
    year_of_study: form.employmentStatus === "Student" ? form.yearOfStudy || undefined : undefined,
    institution_type: form.employmentStatus === "Student" ? form.institutionType || undefined : undefined,
    occupation: form.employmentStatus !== "Student" ? form.occupation.trim() || undefined : undefined,
    annual_family_income: form.annualFamilyIncome === "" ? undefined : form.annualFamilyIncome,
    social_category: form.socialCategory || undefined,
    bpl_status: form.bplStatus || undefined,
    disability_status: form.disabilityStatus || undefined,
  }
}

const reviewRows = (form: FormState): [string, string][] => {
  const rows: [string, string | null | ""][] = [
    ["Name", form.name],
    ["Age", form.age === "" ? "" : String(form.age)],
    ["Gender", form.gender],
    ["Currently", form.employmentStatus],
    ["State", form.state],
    ["District", form.district],
    ["Area type", form.areaType],
    ...(form.employmentStatus === "Student"
      ? ([
          ["Education level", form.educationLevel],
          ["Course", form.course],
          ["Year of study", form.yearOfStudy],
          ["Institution type", form.institutionType],
        ] as [string, string][])
      : ([["Occupation", form.occupation]] as [string, string][])),
    ["Annual family income", form.annualFamilyIncome === "" ? "" : `₹${form.annualFamilyIncome.toLocaleString("en-IN")}`],
    ["Social category", form.socialCategory],
    ["BPL status", form.bplStatus],
    ["Disability status", form.disabilityStatus],
  ]
  return rows.filter((r): r is [string, string] => !!r[1])
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setProfileId } = useAuth()
  // A signed-in person who already saved a profile always edits that
  // one — each account has a single profile.
  const editingProfileId = searchParams.get("profile") ?? user?.profile_id ?? null

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Edit-mode loading: when a ?profile=<id> is present, the existing
  // profile is fetched once and used to populate the form before the
  // person can see/edit anything.
  const [loadingProfile, setLoadingProfile] = useState(!!editingProfileId)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isLast = step === steps.length - 1
  const isReview = step === steps.length - 1

  useEffect(() => {
    if (!editingProfileId) return
    let cancelled = false
    setLoadingProfile(true)
    setLoadError(null)
    getProfile(editingProfileId)
      .then((res) => {
        if (cancelled) return
        setForm(profileToFormState(res.profile))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? "We couldn't find that profile. It may have been removed."
            : "We couldn't load your profile right now. Please try again."
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProfileId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => { const next = { ...e }; delete next[key as string]; return next })
  }

  const occupationStepTitle = form.employmentStatus === "Student" || form.employmentStatus === ""
    ? "Education"
    : "Occupation"
  const displaySteps = steps.map((s, i) => (i === 2 ? occupationStepTitle : s))

  const goNext = () => {
    const stepErrors = validateStep(step, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => Math.min(steps.length - 1, s + 1))
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(0, s - 1))
  }

  const handleSubmit = async () => {
    const allErrors: Errors = {}
    let firstErrorStep: number | null = null
    for (let s = 0; s < steps.length - 1; s++) {
      const stepErrors = validateStep(s, form)
      if (Object.keys(stepErrors).length > 0) {
        Object.assign(allErrors, stepErrors)
        if (firstErrorStep === null) firstErrorStep = s
      }
    }
    if (firstErrorStep !== null) {
      setErrors(allErrors)
      setStep(firstErrorStep)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = buildPayload(form)
      const profileId = editingProfileId
        ? (await updateProfile(editingProfileId, payload)).profile.id
        : (await createProfile(payload)).profile.id
      setProfileId(profileId)
      navigate(`/results?profile=${profileId}`)
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Something went wrong saving your profile. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // --- Edit-mode loading / error states (shown instead of the form) ---

  if (loadingProfile) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center pt-20">
          <Loader2 className="size-5 animate-spin text-muted" />
        </div>
      </PageTransition>
    )
  }

  if (loadError) {
    return (
      <PageTransition>
        <div className="min-h-screen px-3 pb-16 pt-36 sm:px-5 sm:pt-40">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              icon={AlertTriangle}
              title="We couldn't load your profile"
              description={loadError}
              actionLabel="Start a new profile instead"
              onAction={() => {
                window.location.href = "/onboarding"
              }}
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  const stepContent: React.ReactNode[] = [
    <div key="about" className="grid gap-5 sm:grid-cols-2">
      <TextField label="Name" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Priya Sharma" error={errors.name} />
      <NumberField label="Age" value={form.age} onChange={(v) => update("age", v)} placeholder="e.g. 21" min={0} max={120} error={errors.age} />
      <SelectField label="Gender" value={form.gender} onChange={(v) => update("gender", v)} options={genderOptions} error={errors.gender} />
      <ChoiceGroup
        label="You are currently a"
        value={form.employmentStatus}
        onChange={(v) => update("employmentStatus", v)}
        options={employmentOptions}
        error={errors.employmentStatus}
        className="sm:col-span-2"
      />
    </div>,

    <div key="location" className="grid gap-5 sm:grid-cols-2">
      <SearchableCombobox
        label="State"
        placeholder="Select a state or union territory"
        value={form.state}
        options={indianStates}
        error={errors.state}
        onChange={(next) => {
          update("state", next)
          update("district", "")
        }}
      />
      <SearchableCombobox
        label="District"
        placeholder="Select a district"
        value={form.district}
        options={getDistrictsForState(form.state)}
        disabled={!form.state}
        disabledHint="Select a state first"
        error={errors.district}
        onChange={(next) => update("district", next)}
      />
      <ChoiceGroup
        label="Area type"
        value={form.areaType}
        onChange={(v) => update("areaType", v)}
        options={areaTypeOptions}
        error={errors.areaType}
        className="sm:col-span-2"
      />
    </div>,

    <div key="occupation" className="grid gap-5 sm:grid-cols-2">
      {form.employmentStatus === "Student" ? (
        <>
          <SelectField label="Education level" value={form.educationLevel} onChange={(v) => update("educationLevel", v)} options={educationLevelOptions} error={errors.educationLevel} />
          <TextField label="Course" value={form.course} onChange={(v) => update("course", v)} placeholder="e.g. B.Tech, Electrical Engineering" error={errors.course} />
          <SelectField label="Year of study" value={form.yearOfStudy} onChange={(v) => update("yearOfStudy", v)} options={yearOfStudyOptions} error={errors.yearOfStudy} />
          <SelectField label="Institution type" value={form.institutionType} onChange={(v) => update("institutionType", v)} options={institutionTypeOptions} error={errors.institutionType} />
        </>
      ) : (
        <TextField
          label="Occupation"
          value={form.occupation}
          onChange={(v) => update("occupation", v)}
          placeholder={form.employmentStatus === "Farmer" ? "e.g. Farmer" : "e.g. Retail assistant"}
          error={errors.occupation}
          className="sm:col-span-2"
        />
      )}
    </div>,

    <div key="household" className="grid gap-5 sm:grid-cols-2">
      <NumberField
        label="Annual family income (₹)"
        value={form.annualFamilyIncome}
        onChange={(v) => update("annualFamilyIncome", v)}
        placeholder="e.g. 350000"
        min={0}
        error={errors.annualFamilyIncome}
      />
    </div>,

    <div key="eligibility" className="space-y-6">
      <p className="rounded-2xl bg-fg/[0.04] p-4 text-sm leading-relaxed text-muted">
        These help us narrow down relevant schemes. If you're not sure, choose "Unknown" —
        that's different from "No" and won't be held against you.
      </p>
      <SelectField label="Social category" value={form.socialCategory} onChange={(v) => update("socialCategory", v)} options={socialCategoryOptions} error={errors.socialCategory} />
      <ChoiceGroup label="Do you hold a BPL (Below Poverty Line) card?" value={form.bplStatus} onChange={(v) => update("bplStatus", v)} options={yesNoUnknown} error={errors.bplStatus} />
      <ChoiceGroup label="Do you have a disability?" value={form.disabilityStatus} onChange={(v) => update("disabilityStatus", v)} options={yesNoUnknown} error={errors.disabilityStatus} />
    </div>,

    <div key="review" className="space-y-6">
      <p className="text-sm leading-relaxed text-muted">
        Review your answers before continuing. You can go back to any step to make changes.
      </p>
      <dl className="grid gap-x-6 gap-y-5 rounded-3xl bg-fg/[0.04] p-5 sm:grid-cols-2 sm:p-6">
        {reviewRows(form).map(([label, value]) => (
          <div key={label}>
            <dt className="label-micro">{label}</dt>
            <dd className="mt-1 text-[15px] text-fg">{value}</dd>
          </div>
        ))}
      </dl>
      {submitError && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose/15 p-4 text-sm text-rose-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {submitError}
        </div>
      )}
    </div>,
  ]

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col justify-center px-3 pb-28 pt-28 sm:px-5 sm:pt-32 md:pb-16">
        <div className="mx-auto w-full max-w-2xl">
          <p className="label-micro text-accent-ink">
            Step {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
          <h1 className="mt-3 text-balance text-4xl font-light leading-[1.05] text-fg sm:text-5xl">
            {editingProfileId ? "Update your profile." : "Let's find what's available to you."}
          </h1>

          <div className="mt-8">
            <ProgressIndicator steps={displaySteps} currentStep={step} />
          </div>

          <GlassCard className="mt-8 p-6 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="text-3xl font-normal text-fg">{displaySteps[step]}</h2>
                <div className="mt-8">{stepContent[step]}</div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
              <Button variant="outline" size="icon" disabled={step === 0 || submitting} onClick={goBack} aria-label="Previous step">
                <ArrowLeft />
              </Button>
              {isReview ? (
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {submitting ? "Saving…" : editingProfileId ? "Save changes" : "Find My Benefits"}
                </Button>
              ) : (
                <Button variant="primary" onClick={goNext} disabled={isLast}>
                  Continue
                  <ArrowRight />
                </Button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
