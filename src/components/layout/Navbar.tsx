import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Compass, House, ListChecks, LogOut, Menu, Pencil, UserRound, X, type LucideIcon } from "lucide-react"
import { Wordmark } from "@/components/common/Logomark"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/#categories", label: "Categories" },
]

function usePrimaryCta() {
  const { user } = useAuth()
  return user?.profile_id
    ? { to: `/results?profile=${user.profile_id}`, label: "My Benefits" }
    : { to: "/onboarding", label: "Find My Benefits" }
}

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const primaryCta = usePrimaryCta()

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
    navigate("/")
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-3 pr-2 sm:pl-4">
          <Link to="/" aria-label="YojanaAI home">
            <Wordmark size={32} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) =>
              link.to.includes("#") ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      isActive ? "bg-fg/[0.07] text-fg" : "text-muted hover:text-fg"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <AccountMenu email={user.email} profileId={user.profile_id} onLogout={handleLogout} />
            ) : (
              <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign in
              </Link>
            )}
            <Link to={primaryCta.to} className={buttonVariants({ variant: "primary", size: "sm", className: "h-10 px-5" })}>
              {primaryCta.label}
            </Link>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle compact />
            <button
              className="flex size-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-fg/[0.06]"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong mx-auto mt-2 max-w-6xl origin-top rounded-[1.75rem] p-3 md:hidden"
            >
              <nav className="flex flex-col">
                {[...links, { to: "/privacy", label: "Privacy" }, { to: "/terms", label: "Terms" }].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-2xl px-4 py-3 text-[15px] text-fg transition-colors hover:bg-fg/[0.05]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-2 flex flex-col gap-2 border-t border-line px-1 pt-3">
                {user ? (
                  <>
                    <p className="truncate px-3 text-xs text-muted">Signed in as {user.email}</p>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setDrawerOpen(false)} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    Sign in
                  </Link>
                )}
                <Link to={primaryCta.to} onClick={() => setDrawerOpen(false)} className={buttonVariants({ variant: "primary", className: "w-full" })}>
                  {primaryCta.label}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileDock />
    </>
  )
}

function AccountMenu({
  email,
  profileId,
  onLogout,
}: {
  email: string
  profileId: string | null
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex size-10 items-center justify-center rounded-full bg-accent/40 font-display text-sm font-semibold uppercase text-fg transition-colors hover:bg-accent/60"
      >
        {email.charAt(0)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute right-0 top-12 w-64 origin-top-right rounded-3xl p-2"
          >
            <div className="px-3 pb-2 pt-2">
              <p className="label-micro">Signed in as</p>
              <p className="mt-1 truncate text-sm text-fg" title={email}>{email}</p>
            </div>
            <div className="border-t border-line pt-1.5">
              <Link
                role="menuitem"
                to={profileId ? `/onboarding?profile=${profileId}` : "/onboarding"}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm text-fg transition-colors hover:bg-fg/[0.06]"
              >
                <Pencil className="size-4 text-muted" />
                {profileId ? "Edit profile" : "Create profile"}
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-fg/[0.06]"
              >
                <LogOut className="size-4 text-muted" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Floating glass dock with the four main destinations, phones only. */
function MobileDock() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const primaryCta = usePrimaryCta()

  const items: { to: string; label: string; icon: LucideIcon; active: boolean }[] = [
    { to: "/", label: "Home", icon: House, active: pathname === "/" },
    {
      to: "/discover",
      label: "Discover",
      icon: Compass,
      active: pathname.startsWith("/discover") || pathname.startsWith("/scheme"),
    },
    { to: primaryCta.to, label: "Matches", icon: ListChecks, active: pathname.startsWith("/results") },
    {
      to: user ? (user.profile_id ? `/onboarding?profile=${user.profile_id}` : "/onboarding") : "/login",
      label: user ? "Profile" : "Sign in",
      icon: UserRound,
      active: ["/onboarding", "/login", "/signup"].some((p) => pathname.startsWith(p)),
    },
  ]

  return (
    <nav
      aria-label="Main"
      className="glass-strong fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 md:hidden"
    >
      {items.map(({ to, label, icon: Icon, active }) => (
        <Link
          key={label}
          to={to}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-full transition-all duration-300 ease-[var(--ease-soft)]",
            active ? "bg-primary px-4 text-on-primary" : "w-11 text-muted hover:text-fg"
          )}
        >
          <Icon className="size-[18px] shrink-0" />
          {active && <span className="text-[13px] font-medium">{label}</span>}
        </Link>
      ))}
    </nav>
  )
}
