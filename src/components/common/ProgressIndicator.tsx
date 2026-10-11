import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
}

/** Segmented progress bar with the current step's name beneath it. */
export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={currentStep + 1}
        aria-valuetext={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
      >
        {steps.map((step, i) => (
          <div key={step} className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/[0.08]">
            <div
              className={cn(
                "h-full rounded-full bg-accent-strong transition-[width] duration-500 ease-[var(--ease-soft)]",
                i <= currentStep ? "w-full" : "w-0"
              )}
            />
          </div>
        ))}
      </div>
      <ol className="mt-3 hidden justify-between gap-2 sm:flex">
        {steps.map((step, i) => (
          <li
            key={step}
            className={cn(
              "flex-1 text-[11px] font-medium uppercase tracking-[0.12em]",
              i === currentStep ? "text-fg" : i < currentStep ? "text-muted" : "text-subtle"
            )}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
