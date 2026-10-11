import { Link } from "react-router-dom"
import { Wordmark } from "@/components/common/Logomark"

const columns = [
  {
    title: "Product",
    links: [
      { to: "/discover", label: "Discover" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/#categories", label: "Categories" },
    ],
  },
  {
    title: "Your matches",
    links: [
      { to: "/onboarding", label: "Create your profile" },
      { to: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Use" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="px-3 pb-24 pt-10 sm:px-5 md:pb-5">
      <div className="glass relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 pb-8 pt-12 sm:px-10 sm:pt-14">
        <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size={30} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              An independent way to find government schemes and scholarships you may be eligible for.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="label-micro">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-fg/80 transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none relative mt-12 select-none text-center font-display text-[19vw] font-semibold leading-[0.8] tracking-[-0.05em] text-fg/[0.05] lg:text-[13.5rem]"
        >
          yojana
        </p>

        <div className="relative mt-6 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-xs leading-relaxed text-muted">
            YojanaAI is an independent scheme discovery platform and is not affiliated with or endorsed by
            the Government of India or any government department. Always verify eligibility and
            application details on the official source before applying.
          </p>
          <p className="shrink-0 text-xs text-muted">© {new Date().getFullYear()} YojanaAI</p>
        </div>
      </div>
    </footer>
  )
}
