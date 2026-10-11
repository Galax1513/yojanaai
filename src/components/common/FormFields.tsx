import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FieldWrapperProps {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}

function FieldWrapper({ label, error, children, className }: FieldWrapperProps) {
  return (
    <label className={cn("block", className)}>
      <span className="label-micro">{label}</span>
      <div className="mt-2.5">{children}</div>
      {error && <p className="mt-2 text-xs text-rose-ink">{error}</p>}
    </label>
  )
}

const inputClass = (hasError?: boolean) =>
  cn(
    "h-12 w-full rounded-2xl border bg-field px-4 text-[15px] text-fg placeholder:text-subtle transition-[border-color,box-shadow] focus:outline-none focus:ring-4 focus:ring-accent/25",
    hasError ? "border-rose-ink/50" : "border-line focus:border-accent-strong"
  )

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  className,
  type = "text",
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  className?: string
  type?: "text" | "email" | "password"
  autoComplete?: string
}) {
  return (
    <FieldWrapper label={label} error={error} className={className}>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass(!!error)}
      />
    </FieldWrapper>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  error,
  min,
  max,
  className,
}: {
  label: string
  value: number | ""
  onChange: (v: number | "") => void
  placeholder?: string
  error?: string
  min?: number
  max?: number
  className?: string
}) {
  return (
    <FieldWrapper label={label} error={error} className={className}>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        className={inputClass(!!error)}
      />
    </FieldWrapper>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  className,
}: {
  label: string
  value: T | ""
  onChange: (v: T | "") => void
  options: readonly T[]
  placeholder?: string
  error?: string
  className?: string
}) {
  return (
    <FieldWrapper label={label} error={error} className={className}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T | "")}
          className={cn(inputClass(!!error), "appearance-none pr-10", !value && "text-subtle")}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldWrapper>
  )
}

/** Pill-style single choice. Selected pills invert to the primary
 * colour, like a segmented control. */
export function ChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  className,
}: {
  label: string
  value: T | ""
  onChange: (v: T) => void
  options: readonly T[]
  error?: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("block", className)}>
      <span className="label-micro">{label}</span>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm transition-colors",
                selected
                  ? "border-transparent bg-primary text-on-primary"
                  : "border-line bg-field text-fg hover:border-line-strong hover:bg-fg/[0.04]"
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs text-rose-ink">{error}</p>}
    </div>
  )
}
