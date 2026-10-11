/**
 * The fixed, soft colour field behind every page. Frosted glass only
 * reads as glass when there is something behind it to blur, so these
 * washes give the panels depth. Colours come from the theme tokens
 * (--wash-*) and stay muted in both themes; nothing animates.
 */
export function AppBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div style={{ opacity: "var(--wash-opacity)" }} className="absolute inset-0">
        <div
          className="absolute -left-[12%] -top-[18%] h-[60vh] w-[60vw] rounded-full blur-[110px]"
          style={{ background: "var(--wash-a)" }}
        />
        <div
          className="absolute -right-[10%] top-[8%] h-[55vh] w-[45vw] rounded-full blur-[120px]"
          style={{ background: "var(--wash-c)" }}
        />
        <div
          className="absolute -bottom-[20%] left-[18%] h-[55vh] w-[50vw] rounded-full blur-[120px]"
          style={{ background: "var(--wash-b)" }}
        />
        <div
          className="absolute -bottom-[10%] -right-[8%] h-[40vh] w-[35vw] rounded-full blur-[110px]"
          style={{ background: "var(--wash-d)" }}
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
