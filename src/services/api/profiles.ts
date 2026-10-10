import { apiGet, apiPost, apiPut } from "@/services/api/client"
import type { ApiProfileWithCompleteness, ProfileInput } from "@/types/api"

export function createProfile(input: ProfileInput): Promise<ApiProfileWithCompleteness> {
  return apiPost<ApiProfileWithCompleteness>("/profiles", input)
}

export function getMyProfile(): Promise<ApiProfileWithCompleteness> {
  return apiGet<ApiProfileWithCompleteness>("/profiles/me")
}

export function getProfile(id: string): Promise<ApiProfileWithCompleteness> {
  return apiGet<ApiProfileWithCompleteness>(`/profiles/${encodeURIComponent(id)}`)
}

export function updateProfile(id: string, input: ProfileInput): Promise<ApiProfileWithCompleteness> {
  return apiPut<ApiProfileWithCompleteness>(`/profiles/${encodeURIComponent(id)}`, input)
}