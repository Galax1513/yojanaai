import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import * as authApi from "@/services/api/auth"
import { getStoredToken, setStoredToken, setUnauthorizedHandler } from "@/services/api/client"
import type { ApiUser, AuthCredentials } from "@/types/api"

interface AuthContextValue {
  user: ApiUser | null
  /** true while a stored token is being checked on first load. */
  initializing: boolean
  login: (credentials: AuthCredentials) => Promise<ApiUser>
  register: (credentials: AuthCredentials) => Promise<ApiUser>
  logout: () => void
  /** Record that the signed-in user now has a saved profile. */
  setProfileId: (profileId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [initializing, setInitializing] = useState(() => !!getStoredToken())

  const logout = useCallback(() => {
    setStoredToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (!getStoredToken()) return
    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        // Invalid/expired tokens are cleared by the 401 handler; a
        // network error leaves the token so the next visit can retry.
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials: AuthCredentials) => {
    const res = await authApi.login(credentials)
    setStoredToken(res.access_token)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (credentials: AuthCredentials) => {
    const res = await authApi.register(credentials)
    setStoredToken(res.access_token)
    setUser(res.user)
    return res.user
  }, [])

  const setProfileId = useCallback((profileId: string) => {
    setUser((u) => (u ? { ...u, profile_id: profileId } : u))
  }, [])

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, setProfileId }),
    [user, initializing, login, register, logout, setProfileId]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
