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
      <label htmlFor={inputId} className="text-sm text-mist">
        {label}
      </label>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "mt-2 flex h-11 w-full items-center justify-between rounded-md border bg-canvas px-4 text-left text-sm transition-colors focus:outline-none",
          disabled
            ? "cursor-not-allowed border-canvas-line text-mist/50"
            : "border-canvas-line text-sand hover:border-sand/30",
          error && "border-rose/60",
          open && "border-terracotta/50"
        )}
      >
        <span className={value ? "text-sand" : "text-mist/60"}>
          {value || (disabled ? disabledHint ?? placeholder : placeholder)}
        </span>
        <ChevronDown className={cn("size-4 text-mist transition-transform", open && "rotate-180")} />
      </button>

      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}

      {open && !disabled && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-canvas-line bg-canvas-raised shadow-xl">
          <div className="flex items-center gap-2 border-b border-canvas-line px-3">
            <Search className="size-3.5 shrink-0 text-mist" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-10 w-full bg-transparent text-sm text-sand placeholder:text-mist/60 focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-mist">No matches</li>
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
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-sand transition-colors hover:bg-canvas"
                >
                  {option}
                  {value === option && <Check className="size-3.5 text-terracotta-soft" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
