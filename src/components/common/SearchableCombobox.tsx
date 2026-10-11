import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchableComboboxProps {
  label: string
  placeholder?: string
  value: string | null
  onChange: (value: string) => void
  options: string[]
  disabled?: boolean
  disabledHint?: string
  error?: string
}

/**
 * A searchable single-select combobox: click to open, type to filter,
 * click an option to select. Selecting always stores one of the exact
 * strings from `options` — free typing narrows the list but can never
 * itself become the stored value, so state/district fields always hold
 * canonical values rather than arbitrary user text.
 */
export function SearchableCombobox({
  label,
  placeholder = "Search…",
  value,
  onChange,
  options,
  disabled = false,
  disabledHint,
  error,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div className="relative" ref={rootRef}>
      <label htmlFor={inputId} className="label-micro">
        {label}
      </label>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "mt-2.5 flex h-12 w-full items-center justify-between rounded-2xl border bg-field px-4 text-left text-[15px] transition-[border-color,box-shadow] focus:outline-none",
          disabled
            ? "cursor-not-allowed border-line text-subtle"
            : "border-line text-fg hover:border-line-strong",
          error && "border-rose-ink/50",
          open && "border-accent-strong ring-4 ring-accent/25"
        )}
      >
        <span className={cn("truncate", value ? "text-fg" : "text-subtle")}>
          {value || (disabled ? disabledHint ?? placeholder : placeholder)}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {error && <p className="mt-2 text-xs text-rose-ink">{error}</p>}

      {open && !disabled && (
        <div className="glass-strong absolute z-30 mt-2 w-full overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search className="size-3.5 shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-11 w-full bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1.5" role="listbox">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">No matches</li>
            )}
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-fg/[0.06]"
                >
                  {option}
                  {value === option && <Check className="size-3.5 text-accent-ink" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
