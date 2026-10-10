import { apiGet } from "@/services/api/client"
import type { ApiSchemeDetail, ApiSchemeListResponse, ApiSupportCategory, SchemeListParams } from "@/types/api"

export function getSchemes(params: SchemeListParams): Promise<ApiSchemeListResponse> {
  return apiGet<ApiSchemeListResponse>("/schemes", { ...params })
}

export function getSupportCategories(): Promise<ApiSupportCategory[]> {
  return apiGet<ApiSupportCategory[]>("/schemes/support-categories")
}

export function getScheme(slug: string): Promise<ApiSchemeDetail> {
  return apiGet<ApiSchemeDetail>(`/schemes/${encodeURIComponent(slug)}`)
}
