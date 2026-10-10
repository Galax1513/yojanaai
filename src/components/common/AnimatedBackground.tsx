import { cn } from "@/lib/utils"

interface AnimatedBackgroundProps {
  className?: string
  variant?: "canvas" | "sand"
}

/**
 * A quiet, non-distracting ambient background used behind product UI
 * sections. Two soft radial washes in the warm palette — no motion by
 * default so it never competes with foreground content.
 */
export function AnimatedBackground({ className, variant = "canvas" }: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {variant === "canvas" ? (
        <>
          <div
            className="absolute -left-1/4 top-0 size-[36rem] rounded-full opacity-[0.14] blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-terracotta), transparent 70%)" }}
          />
          <div
            className="absolute -right-1/4 bottom-0 size-[30rem] rounded-full opacity-[0.10] blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-moss), transparent 70%)" }}
          />
        </>
      ) : (
        <div
          className="absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-marigold), transparent 70%)" }}
        />
      )}
    </div>
  )
}
