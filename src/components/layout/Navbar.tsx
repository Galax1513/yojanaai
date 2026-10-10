import { useEffect, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Logomark } from "@/components/common/Logomark"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/#categories", label: "Categories" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const primaryCta = user?.profile_id
    ? { to: `/results?profile=${user.profile_id}`, label: "My Benefits" }
    : { to: "/onboarding", label: "Find My Benefits" }

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
    navigate("/")
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-sand/10 bg-canvas/85 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setDrawerOpen(false)}>
          <Logomark size={26} />
          <span className="font-display text-lg text-sand">YojanaAI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="text-sm text-mist transition-colors hover:text-sand"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="max-w-48 truncate text-sm text-mist" title={user.email}>
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
          )}
          <Link to={primaryCta.to} className={buttonVariants({ variant: "accent", size: "sm" })}>
            {primaryCta.label}
          </Link>
        </div>

        <button
          className="flex size-9 items-center justify-center text-sand md:hidden"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-sand/10 bg-canvas md:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-md px-2 py-3 text-base text-sand"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <p className="truncate px-2 text-sm text-mist">Signed in as {user.email}</p>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className={buttonVariants({ variant: "outline" }) + " w-full"}
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  to={primaryCta.to}
                  onClick={() => setDrawerOpen(false)}
                  className={buttonVariants({ variant: "accent" }) + " w-full"}
                >
                  {primaryCta.label}
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
