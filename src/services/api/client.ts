/**
 * The single place that talks to the FastAPI backend over HTTP.
 * Components never call fetch() directly — they go through
 * src/services/api/schemes.ts, profiles.ts, etc., which use this client.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// The login token is kept in localStorage so a person stays signed in
// across visits. AuthContext owns reading/writing it; this module only
// attaches it to requests.
const TOKEN_KEY = "yojanaai.token"

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable (private mode etc.) — session just won't persist
  }
}

// AuthContext registers a handler so an expired/invalid token (401)
// signs the person out everywhere instead of leaving a dead session.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  const token = getStoredToken()
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    // Network failure (backend unreachable, CORS, DNS, etc.) — never
    // silently fall back to mock data; the caller decides how to
    // surface this.
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.")
  }

  if (response.status === 401 && token) onUnauthorized?.()

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body?.detail === "string") detail = body.detail
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : ""
  return request<T>(`${path}${query}`, { method: "GET" })
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) })
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) })
}
