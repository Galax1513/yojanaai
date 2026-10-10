import { Link } from "react-router-dom"
import { Logomark } from "@/components/common/Logomark"

const productLinks = [
  { to: "/discover", label: "Discover" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/#categories", label: "Categories" },
]

const resourceLinks = [
  { to: "/discover", label: "Scheme information" },
  { to: "/onboarding", label: "Create your profile" },
]

const legalLinks = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Use" },
]

export function Footer() {
  return (
    <footer className="border-t border-canvas-line bg-canvas">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logomark size={24} />
              <span className="font-display text-lg text-sand">YojanaAI</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-mist">Find schemes you may be eligible for.</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mist">Product</p>
            <ul className="mt-4 space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-mist transition-colors hover:text-sand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mist">Resources</p>
            <ul className="mt-4 space-y-3">
              {resourceLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-mist transition-colors hover:text-sand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mist">Legal</p>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-mist transition-colors hover:text-sand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-canvas-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-mist">
            YojanaAI is an independent scheme discovery platform and is not affiliated with or endorsed by
            the Government of India or any government department. Always verify eligibility and
            application details on the official source before applying.
          </p>
          <p className="shrink-0 text-xs text-mist">© {new Date().getFullYear()} YojanaAI</p>
        </div>
      </div>
    </footer>
  )
}
