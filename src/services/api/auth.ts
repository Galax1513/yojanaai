import { apiGet, apiPost } from "@/services/api/client"
import type { ApiAuthResponse, ApiUser, AuthCredentials } from "@/types/api"

export function register(credentials: AuthCredentials): Promise<ApiAuthResponse> {
  return apiPost<ApiAuthResponse>("/auth/register", credentials)
}

export function login(credentials: AuthCredentials): Promise<ApiAuthResponse> {
  return apiPost<ApiAuthResponse>("/auth/login", credentials)
}

export function getMe(): Promise<ApiUser> {
  return apiGet<ApiUser>("/auth/me")
}
