import { Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

/** Segmented sun / moon switch. `compact` renders a single round
 * button instead, for tight spaces like the mobile header. */
export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { theme, setTheme, toggleTheme } = useTheme()

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-fg transition-colors hover:bg-fg/[0.06]",
          className
        )}
      >
        {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </button>
    )
  }

  const options = [
    { value: "light" as const, icon: Sun, label: "Light theme" },
    { value: "dark" as const, icon: Moon, label: "Dark theme" },
  ]

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn("relative flex h-9 items-center rounded-full bg-fg/[0.06] p-1", className)}
    >
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex h-7 w-8 items-center justify-center rounded-full transition-colors",
              active ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-thumb"
                className="absolute inset-0 rounded-full bg-surface shadow-[0_2px_8px_-2px_rgb(0_0_0/0.25)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="relative size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
