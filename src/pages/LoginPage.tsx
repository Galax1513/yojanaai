import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { AlertTriangle, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/common/PageTransition"
import { GlassCard } from "@/components/common/GlassCard"
import { TextField } from "@/components/common/FormFields"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { ApiError } from "@/services/api/client"
import type { ApiUser } from "@/types/api"
import sideImage from "@/assets/images/closing-market-street-mobile.webp"

type Mode = "login" | "signup"

/** Where to go after signing in: back to wherever RequireAuth bounced
 * them from, else their results if they've already filled in a
 * profile, else onboarding. */
function destinationFor(user: ApiUser, from: string | undefined): string {
  if (from) return from
  return user.profile_id ? `/results?profile=${user.profile_id}` : "/onboarding"
}

export function LoginPage({ mode }: { mode: Mode }) {
  const { user, initializing, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isSignup = mode === "signup"

  if (!initializing && user) return <Navigate to={destinationFor(user, from)} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) nextErrors.email = "Please enter a valid email."
    if (isSignup && password.length < 8) nextErrors.password = "Use at least 8 characters."
    if (!isSignup && !password) nextErrors.password = "Please enter your password."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const credentials = { email: email.trim(), password }
      const signedIn = isSignup ? await register(credentials) : await login(credentials)
      navigate(destinationFor(signedIn, from), { replace: true })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col justify-center px-3 pb-28 pt-28 sm:px-5 sm:pt-32 md:pb-16">
        <GlassCard className="mx-auto grid w-full max-w-5xl overflow-hidden p-2 lg:grid-cols-2">
          <div className="relative hidden min-h-[34rem] overflow-hidden rounded-[1.4rem] lg:block">
            <img
              src={sideImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover saturate-[0.78]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night/75 via-night/10 to-transparent" />
            <div className="glass-photo absolute inset-x-5 bottom-5 rounded-3xl p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cream/70">Why an account</p>
              <p className="mt-2 font-display text-2xl font-light leading-snug text-cream">
                Save your details once and come back to your matches any time.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 py-10 sm:px-12 sm:py-14">
            <p className="label-micro text-accent-ink">{isSignup ? "Create account" : "Sign in"}</p>
            <h1 className="mt-3 text-4xl font-light leading-[1.05] text-fg sm:text-5xl">
              {isSignup ? "Create your account." : "Welcome back."}
            </h1>
            <p className="mt-3 text-sm text-muted">
              {isSignup
                ? "One account, one profile. Edit it whenever you like."
                : "Sign in to see your saved profile and matches."}
            </p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5" noValidate>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                error={errors.email}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={setPassword}
                placeholder={isSignup ? "At least 8 characters" : ""}
                error={errors.password}
              />

              {submitError && (
                <div className="flex items-start gap-2 rounded-2xl bg-rose/15 p-4 text-sm text-rose-ink">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              {isSignup ? "Already have an account? " : "New to YojanaAI? "}
              <Link
                to={isSignup ? "/login" : "/signup"}
                state={location.state}
                className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
