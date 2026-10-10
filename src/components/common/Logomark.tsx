interface LogomarkProps {
  className?: string
  size?: number
}

/**
 * Original abstract mark for YojanaAI.
 *
 * Concept: a rising sun over a winding path, cradled by a leaf-like arc —
 * discovery (sun), a route forward (path), and everyday life / nature
 * (leaf). Deliberately avoids the Indian tricolour, government seals,
 * domes or any state-affiliation imagery.
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
      <path
        d="M4 30c5-9 11-13 16-13s11 4 16 13"
        stroke="var(--color-moss, #55663f)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="17" r="7" fill="var(--color-terracotta, #c1552b)" />
      <path
        d="M6 31c4.5-2.5 9-3.6 14-3.6s9.5 1.1 14 3.6"
        stroke="var(--color-marigold, #d5a03e)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  )
}
