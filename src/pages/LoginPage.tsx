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
      <div className="flex min-h-screen flex-col justify-center py-32">
        <div className="mx-auto w-full max-w-md px-5 sm:px-8">
          <h1 className="font-display text-2xl text-sand sm:text-3xl">
            {isSignup ? "Create your account." : "Welcome back."}
          </h1>
          <p className="mt-2 text-sm text-mist">
            {isSignup
              ? "Save your details once and come back to your matches any time."
              : "Sign in to see your saved profile and matches."}
          </p>

          <GlassCard className="mt-8 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                <div className="flex items-start gap-2 rounded-md border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <Button type="submit" variant="accent" className="w-full gap-1.5" disabled={submitting}>
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                {isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 border-t border-canvas-line pt-6 text-center text-sm text-mist">
              {isSignup ? "Already have an account? " : "New to YojanaAI? "}
              <Link
                to={isSignup ? "/login" : "/signup"}
                state={location.state}
                className="text-sand underline-offset-4 hover:underline"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
