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
      <span className="text-sm text-mist">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
    </label>
  )
}

const inputClass = (hasError?: boolean) =>
  cn(
    "h-11 w-full rounded-md border bg-canvas px-4 text-sm text-sand placeholder:text-mist/60 focus:outline-none",
    hasError ? "border-rose/60" : "border-canvas-line focus:border-terracotta/50"
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className={cn(inputClass(!!error), "appearance-none")}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}

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
    <FieldWrapper label={label} error={error} className={className}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm transition-colors",
              value === opt
                ? "border-terracotta bg-terracotta/15 text-terracotta-soft"
                : "border-canvas-line text-mist hover:border-sand/30 hover:text-sand"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </FieldWrapper>
  )
}