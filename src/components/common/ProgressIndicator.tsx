import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((step, i) => {
        const isComplete = i < currentStep
        const isCurrent = i === currentStep
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                  isComplete && "bg-moss text-sand",
                  isCurrent && "bg-terracotta text-sand",
                  !isComplete && !isCurrent && "bg-canvas-raised text-mist"
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  isCurrent ? "text-sand" : "text-mist"
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px w-4 sm:w-8", isComplete ? "bg-moss" : "bg-canvas-line")} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
