interface LogomarkProps {
  className?: string
  size?: number
}

/**
 * Original abstract mark for YojanaAI: a low sun resting on two dune
 * lines — a route forward through open ground. Drawn in the theme's
 * own colours; deliberately no tricolour, seals or state imagery.
 */
export function Logomark({ className, size = 28 }: LogomarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <circle cx="20" cy="18" r="6" fill="var(--accent)" />
      <path d="M7 27c4.5-3.2 8.8-4.8 13-4.8S28.5 23.8 33 27" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 31.5c3-1.6 6-2.4 9-2.4s6 .8 9 2.4" stroke="var(--on-primary)" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Logomark plus the "YojanaAI" wordmark. */
export function Wordmark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={className ? `flex items-center gap-2.5 ${className}` : "flex items-center gap-2.5"}>
      <Logomark size={size} />
      <span className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-fg">
        Yojana<span className="font-normal text-muted">AI</span>
      </span>
    </span>
  )
}
